// Add Tracking against a fake PayPal, the way the APIMatic PayPal plugin's testing skill describes: the real SDK
// over a fake `fetch` that answers in PayPal's wire shape, so encoding, decoding and errors are the SDK's own.
// The cases are the rows of paypal-plan.md (UNKNOWN OUTCOMES, 1b.3 and 1b.4).
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
process.env.PAYPAL_CLIENT_ID = "test-id";
process.env.PAYPAL_CLIENT_SECRET = "test-secret";
const { addTracking, trackingClient } = await import("../src/server/paypal/tracking");

type Reply = { status: number; body?: unknown } | "drop";
type Call = { method: string; path: string; headers: Headers; body: unknown };
const json = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const TOKEN = { status: 200, body: { access_token: "tok", token_type: "Bearer", expires_in: 3600 } };

/** A fake PayPal routed on method + path; a list answers in order (the last one repeats). */
function fakePayPal(routes: Record<string, Reply | Reply[]>) {
  const calls: Call[] = [];
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const req = new Request(input, init);
    const path = new URL(req.url).pathname;
    const text = req.body ? await req.clone().text() : "";
    calls.push({ method: req.method, path, headers: req.headers, body: text && path !== "/v1/oauth2/token" ? JSON.parse(text) : null });
    const route = routes[`${req.method} ${path}`] ?? (path === "/v1/oauth2/token" ? TOKEN : { status: 404, body: { name: "RESOURCE_NOT_FOUND", message: "no route", debug_id: "dbg-404" } });
    const r = Array.isArray(route) ? (route.length > 1 ? route.shift()! : route[0]) : route;
    if (r === "drop") throw new TypeError("fetch failed: socket hang up");
    return json(r.status, r.body);
  };
  // delay 0 so a retried read doesn't wait out the real backoff.
  return { client: trackingClient(fetch, { delay: 0, maxJitter: 0 }), calls, writes: () => calls.filter((c) => c.method === "POST" && c.path.endsWith("/track")) };
}

const TRACK = "POST /v2/checkout/orders/ORDER-1/track";
const GET_ORDER = "GET /v2/checkout/orders/ORDER-1";
const order = (trackers: { id: string; status: string }[]) => ({ id: "ORDER-1", status: "COMPLETED", purchase_units: [{ shipping: { trackers } }] });
const SHIPPED = order([{ id: "CAP-1-1Z999AA10123456784", status: "SHIPPED" }]);
const input = { captureId: "CAP-1", orderId: "ORDER-1", carrier: "UPS" as const, trackingNumber: "1Z999AA10123456784" };
const paypalError = (name: string, debug_id: string, details?: { issue: string; description: string }[]) => ({ name, message: "The requested action could not be performed.", debug_id, ...(details && { details }) });

describe("Add Tracking with the plugin's PayPal SDK", () => {
  it("sends only the fields the plan requires, under PayPal's wire names", async () => {
    const pp = fakePayPal({ [TRACK]: { status: 201, body: SHIPPED } });
    expect(await addTracking(input, pp.client)).toEqual({ outcome: "added", orderId: "ORDER-1", trackerId: "CAP-1-1Z999AA10123456784", status: "SHIPPED" });
    const [write] = pp.writes();
    expect(write.body).toEqual({ capture_id: "CAP-1", tracking_number: "1Z999AA10123456784", carrier: "UPS", notify_payer: true });
    expect(write.headers.get("authorization")).toBe("Bearer tok");
    expect(write.headers.get("paypal-auth-assertion")).toBeNull(); // optional, nothing requires it (1b.3)
  });

  it("names the carrier only when it is Other", async () => {
    const pp = fakePayPal({ [TRACK]: { status: 201, body: SHIPPED } });
    await addTracking({ ...input, carrier: "OTHER", carrierNameOther: "GIG Logistics" }, pp.client);
    expect(pp.writes()[0].body).toMatchObject({ carrier: "OTHER", carrier_name_other: "GIG Logistics" });
  });

  it("finds the order from the capture when Cleared doesn't know it", async () => {
    const pp = fakePayPal({
      "GET /v2/payments/captures/CAP-1": { status: 200, body: { id: "CAP-1", status: "COMPLETED", supplementary_data: { related_ids: { order_id: "ORDER-1" } } } },
      [TRACK]: { status: 201, body: SHIPPED },
    });
    expect((await addTracking({ ...input, orderId: null }, pp.client)).orderId).toBe("ORDER-1");
  });

  it("retries a read that hits a 503, through the SDK's own retry", async () => {
    const pp = fakePayPal({
      "GET /v2/payments/captures/CAP-1": [{ status: 503 }, { status: 200, body: { id: "CAP-1", status: "COMPLETED", supplementary_data: { related_ids: { order_id: "ORDER-1" } } } }],
      [TRACK]: { status: 201, body: SHIPPED },
    });
    await addTracking({ ...input, orderId: null }, pp.client);
    expect(pp.calls.filter((c) => c.path === "/v2/payments/captures/CAP-1")).toHaveLength(2);
  });

  describe("unknown outcomes are settled by re-reading, never re-sending", () => {
    it("a dropped connection is settled by re-reading the order", async () => {
      const pp = fakePayPal({ [TRACK]: "drop", [GET_ORDER]: { status: 200, body: SHIPPED } });
      expect(await addTracking(input, pp.client)).toMatchObject({ outcome: "added", trackerId: "CAP-1-1Z999AA10123456784" });
      expect(pp.writes()).toHaveLength(1);
      expect(pp.calls.some((c) => c.method === "GET" && c.path === "/v2/checkout/orders/ORDER-1")).toBe(true);
    });

    it("a dropped connection that can't be settled is unknown, never failed", async () => {
      const pp = fakePayPal({ [TRACK]: "drop", [GET_ORDER]: { status: 200, body: order([]) } });
      expect(await addTracking(input, pp.client)).toEqual({ outcome: "unknown", orderId: "ORDER-1" });
      expect(pp.writes()).toHaveLength(1);
    });

    it("an unreadable 2xx reply is unknown too, and is re-read", async () => {
      const pp = fakePayPal({ [TRACK]: { status: 201, body: { purchase_units: "not a list" } }, [GET_ORDER]: { status: 200, body: SHIPPED } });
      expect(await addTracking(input, pp.client)).toMatchObject({ outcome: "added" });
    });

    it("a 500 whose tracker landed counts as added; the write is sent once", async () => {
      const pp = fakePayPal({ [TRACK]: { status: 500, body: paypalError("INTERNAL_SERVER_ERROR", "dbg-500") }, [GET_ORDER]: { status: 200, body: SHIPPED } });
      expect((await addTracking(input, pp.client)).outcome).toBe("added");
      expect(pp.writes()).toHaveLength(1);
    });

    it("a 500 whose tracker didn't land is PayPal's failure, with a fixed message", async () => {
      const pp = fakePayPal({ [TRACK]: { status: 500, body: paypalError("INTERNAL_SERVER_ERROR", "dbg-500") }, [GET_ORDER]: { status: 200, body: order([]) } });
      await expect(addTracking(input, pp.client)).rejects.toMatchObject({ status: 500, debugId: "dbg-500", message: "PayPal had a problem adding the tracking. Try again in a minute." });
    });

    it("a credential that can't be obtained is never re-read", async () => {
      const pp = fakePayPal({ "POST /v1/oauth2/token": { status: 401, body: { error: "invalid_client", error_description: "Client Authentication failed" } } });
      await expect(addTracking(input, pp.client)).rejects.toMatchObject({ message: "Cleared couldn’t sign in to PayPal. Try again later." });
      expect(pp.calls.every((c) => c.path === "/v1/oauth2/token")).toBe(true);
    });
  });

  describe("when PayPal says no (1b.4)", () => {
    it("turns a 422 into PayPal's own words, with its debug id", async () => {
      const pp = fakePayPal({ [TRACK]: { status: 422, body: paypalError("UNPROCESSABLE_ENTITY", "dbg-422", [{ issue: "INVALID_TRACKING_NUMBER", description: "The tracking number is invalid." }]) } });
      await expect(addTracking(input, pp.client)).rejects.toMatchObject({ status: 422, debugId: "dbg-422", message: "The tracking number is invalid." });
      expect(pp.calls.some((c) => c.method === "GET")).toBe(false);
    });

    it("a 403 is our credentials, not the seller's mistake", async () => {
      const pp = fakePayPal({ [TRACK]: { status: 403, body: paypalError("NOT_AUTHORIZED", "dbg-403", [{ issue: "PERMISSION_DENIED", description: "No permission." }]) } });
      await expect(addTracking(input, pp.client)).rejects.toMatchObject({ status: 403, message: "Cleared couldn’t connect to your PayPal account. Try again later." });
    });
  });
});
