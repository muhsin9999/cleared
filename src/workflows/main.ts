// Render Workflow "cleared-wf": durable, retried background tasks. Started from the web app with
// render.workflows.startTask("cleared-wf/<task>", args) (src/server/workflows.ts).
// Run with: tsx --conditions=react-server src/workflows/main.ts  (the condition makes "server-only" a no-op)
import { task, type TaskContext } from "@renderinc/sdk/workflows";
import { eq } from "drizzle-orm";
import { db, schema as s } from "../db";
import { submitEvidence } from "../server/paypal/evidence";

// F6: send an approved evidence packet to PayPal (Disputes provide-evidence). Retries transient failures.
task(
  { name: "submitEvidence", retry: { maxRetries: 2, waitDurationMs: 2_000, backoffScaling: 2 } },
  async function submitEvidenceTask(_ctx: TaskContext, packetId: string) {
    try {
      return await submitEvidence(packetId);
    } catch (e) {
      await db.update(s.packets).set({ status: "failed", error: (e as Error).message.slice(0, 500) }).where(eq(s.packets.id, packetId));
      throw e;
    }
  },
);

// Health check task used by the day-1 spike and deploy checks.
task({ name: "ping" }, async function ping() {
  return { ok: true, at: new Date().toISOString() };
});
