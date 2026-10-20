// Day-1 spike: the task shapes Cleared needs (chaining, retries, PayPal access from a task).
import { task, type TaskContext } from "@renderinc/sdk/workflows";

const BASE = "https://api-m.sandbox.paypal.com";

const paypalPing = task(
  { name: "paypalPing", retry: { maxRetries: 2, waitDurationMs: 1000, backoffScaling: 2 } },
  async function paypalPing(_ctx: TaskContext): Promise<{ appId: string; scopes: number }> {
    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
    const res = await fetch(`${BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) throw new Error(`PayPal OAuth ${res.status}`);
    const body = (await res.json()) as { app_id: string; scope: string };
    return { appId: body.app_id, scopes: body.scope.split(" ").length };
  },
);

const draftPacket = task({ name: "draftPacket" }, function draftPacket(_ctx: TaskContext, disputeId: string) {
  return { disputeId, claims: 3, status: "AWAITING_APPROVAL" };
});

task({ name: "onDisputeCreated" }, async function onDisputeCreated(ctx: TaskContext, disputeId: string) {
  const ping = await ctx.run(paypalPing);
  const packet = await ctx.run(draftPacket, disputeId);
  return { ping, packet };
});
