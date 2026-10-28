// The PayPal client against a fake fetch: a cut-off reply (what failed the dispute sync on 28 Oct 2026) is retried
// once for a read, never for a write, and surfaces as a PayPalError naming the call.
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/net", () => ({}));
process.env.PAYPAL_CLIENT_ID = "id";
process.env.PAYPAL_CLIENT_SECRET = "secret";
const { paypal, PayPalError } = await import("../src/server/paypal/client");

const TOKEN = new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
function fake(replies: (() => Response)[]) {
  const calls: string[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const path = new URL(url).pathname;
    if (path === "/v1/oauth2/token") return TOKEN.clone();
    calls.push(`${init.method} ${path}`);
    return (replies.length > 1 ? replies.shift()! : replies[0])();
  });
  return calls;
}
const cutOff = () => new Response('{"dispute_id":"PP-D-1","status":"WAI', { status: 200, headers: { "paypal-debug-id": "dbg-9" } });
const good = () => new Response(JSON.stringify({ dispute_id: "PP-D-1", status: "WAITING_FOR_SELLER_RESPONSE" }), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe("paypal client", () => {
  it("retries a read once after a cut-off reply, and returns the good one", async () => {
    const calls = fake([cutOff, good]);
    expect(await paypal("GET", "/v1/customer/disputes/PP-D-1")).toEqual({ dispute_id: "PP-D-1", status: "WAITING_FOR_SELLER_RESPONSE" });
    expect(calls).toHaveLength(2);
  }, 10_000);

  it("a read that stays unreadable fails as a PayPalError naming the call, with PayPal's debug id", async () => {
    const calls = fake([cutOff]);
    const err = (await paypal("GET", "/v1/customer/disputes/PP-D-1").catch((e: unknown) => e)) as InstanceType<typeof PayPalError>;
    expect(err).toBeInstanceOf(PayPalError);
    expect(err.message).toBe("PayPal GET /v1/customer/disputes/PP-D-1 sent an unreadable reply");
    expect(err.debugId).toBe("dbg-9");
    expect(calls).toHaveLength(2);
  }, 10_000);

  it("never repeats a write", async () => {
    const calls = fake([cutOff, good]);
    await expect(paypal("POST", "/v1/customer/disputes/PP-D-1/accept-claim", { body: {} })).rejects.toBeInstanceOf(PayPalError);
    expect(calls).toHaveLength(1);
  });

  it("does not retry a refusal (4xx)", async () => {
    const calls = fake([() => new Response(JSON.stringify({ message: "Not found" }), { status: 404 })]);
    await expect(paypal("GET", "/v1/customer/disputes/nope")).rejects.toMatchObject({ status: 404 });
    expect(calls).toHaveLength(1);
  });
});
