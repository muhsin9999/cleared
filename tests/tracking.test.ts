// Add Tracking against a fake PayPal, the way the APIMatic PayPal plugin's testing skill describes: a fake
// `fetch` answering with bodies in PayPal's wire shape, so the real SDK encodes, decodes and raises errors.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
process.env.PAYPAL_CLIENT_ID = "test-id";
process.env.PAYPAL_CLIENT_SECRET = "test-secret";
const { addTracking, trackingClient } = await import("../src/server/paypal/tracking");

type Reply = { status: number; body?: unknown; headers?: Record<string, string> };
const json = (r: Reply) => new Response(r.body === undefined ? null : JSON.stringify(r.body), { status: r.status, headers: { "content-type": "application/json", ...r.headers } });

let calls: { method: string; path: string; body: unknown }[];
function fakePayPal(routes: Record<string, Reply | Reply[]>) {
  calls = [];
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(input, init);
    const path = new URL(req.url).pathname;
    const text = req.method === "GET" ? "" : await req.text();
    calls.push({ method: req.method, path, body: text && path !== "/v1/oauth2/token" ? JSON.parse(text) : null });
    if (path === "/v1/oauth2/token") return json({ status: 200, body: { access_token: "tok", token_type: "Bearer", expires_in: 3600 } });
    const r = routes[`${req.method} ${path}`];
    if (!r) return json({ status: 404, body: { name: "NOT_FOUND", message: "no route", debug_id: "dbg-404" } });
    return json(Array.isArray(r) ? (r.length > 1 ? r.shift()! : r[0]) : r);
  };
}

const order = (trackers: { id: string; status: string }[]) => ({ id: "ORDER-1", status: "COMPLETED", purchase_units: [{ shipping: { trackers } }] });
const input = { captureId: "CAP-1", orderId: "ORDER-1", carrier: "UPS" as const, trackingNumber: "1Z999AA10123456784" };

describe("Add Tracking with the plugin's PayPal SDK", () => {
  beforeEach(() => vi.useRealTimers());

  it("sends PayPal's field names and returns the new tracker", async () => {
    const client = trackingClient(fakePayPal({ "POST /v2/checkout/orders/ORDER-1/track": { status: 201, body: order([{ id: "CAP-1-1Z999AA10123456784", status: "SHIPPED" }]) } }));
    const r = await addTracking(input, client);
    expect(r).toEqual({ orderId: "ORDER-1", trackerId: "CAP-1-1Z999AA10123456784", status: "SHIPPED" });
    const post = calls.find((c) => c.method === "POST" && c.path.endsWith("/track"))!;
    expect(post.body).toEqual({ capture_id: "CAP-1", tracking_number: "1Z999AA10123456784", carrier: "UPS", notify_payer: true });
  });

  it("finds the order from the capture when Cleared doesn't know it", async () => {
    const client = trackingClient(
      fakePayPal({
        "GET /v2/payments/captures/CAP-1": { status: 200, body: { id: "CAP-1", status: "COMPLETED", supplementary_data: { related_ids: { order_id: "ORDER-1" } } } },
        "POST /v2/checkout/orders/ORDER-1/track": { status: 201, body: order([{ id: "CAP-1-1Z999AA10123456784", status: "SHIPPED" }]) },
      }),
    );
    expect((await addTracking({ ...input, orderId: null }, client)).orderId).toBe("ORDER-1");
  });

  it("turns a 422 into PayPal's own words, with its debug id", async () => {
    const client = trackingClient(fakePayPal({ "POST /v2/checkout/orders/ORDER-1/track": { status: 422, body: { name: "UNPROCESSABLE_ENTITY", message: "The requested action could not be performed.", debug_id: "dbg-422", details: [{ issue: "INVALID_TRACKING_NUMBER", description: "The tracking number is invalid." }] } } }));
    await expect(addTracking(input, client)).rejects.toMatchObject({ status: 422, debugId: "dbg-422", message: "The tracking number is invalid." });
  });

  it("never sends the tracking twice: after a 500 it checks the order and finds the tracker landed", async () => {
    const client = trackingClient(
      fakePayPal({
        "POST /v2/checkout/orders/ORDER-1/track": { status: 500, body: { name: "INTERNAL_SERVER_ERROR", message: "boom", debug_id: "dbg-500" } },
        "GET /v2/checkout/orders/ORDER-1": { status: 200, body: order([{ id: "CAP-1-1Z999AA10123456784", status: "SHIPPED" }]) },
      }),
    );
    expect((await addTracking(input, client)).trackerId).toBe("CAP-1-1Z999AA10123456784");
    expect(calls.filter((c) => c.method === "POST" && c.path.endsWith("/track"))).toHaveLength(1);
  });

  it("reports a 500 when the tracker really didn't land", async () => {
    const client = trackingClient(
      fakePayPal({
        "POST /v2/checkout/orders/ORDER-1/track": { status: 500, body: { name: "INTERNAL_SERVER_ERROR", message: "boom", debug_id: "dbg-500" } },
        "GET /v2/checkout/orders/ORDER-1": { status: 200, body: order([]) },
      }),
    );
    await expect(addTracking(input, client)).rejects.toMatchObject({ status: 500, debugId: "dbg-500" });
    expect(calls.filter((c) => c.method === "POST" && c.path.endsWith("/track"))).toHaveLength(1);
  });

  it("retries a read that hits a 503, through the SDK's own retry", async () => {
    const client = trackingClient(
      fakePayPal({
        "GET /v2/payments/captures/CAP-1": [{ status: 503 }, { status: 200, body: { id: "CAP-1", status: "COMPLETED", supplementary_data: { related_ids: { order_id: "ORDER-1" } } } }],
        "POST /v2/checkout/orders/ORDER-1/track": { status: 201, body: order([{ id: "CAP-1-1Z999AA10123456784", status: "SHIPPED" }]) },
      }),
    );
    expect((await addTracking({ ...input, orderId: null }, client)).orderId).toBe("ORDER-1");
    expect(calls.filter((c) => c.path === "/v2/payments/captures/CAP-1")).toHaveLength(2);
  });
});
