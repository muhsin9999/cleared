// Starts Render Workflow tasks. On Render (USE_RENDER_WORKFLOWS=true) tasks run on the cleared-wf service;
// locally they run in-process so development doesn't touch the hosted workflow or its database.
import "server-only";
import { Render } from "@renderinc/sdk";
import { after } from "next/server";
import { draftPacket, draftTemplateFallback } from "./ai/investigator";
import { submitEvidence } from "./paypal/evidence";

async function draftPacketLocal(packetId: string) {
  try {
    await draftPacket(packetId);
  } catch (e) {
    await draftTemplateFallback(packetId, (e as Error).message);
  }
}

const LOCAL = { submitEvidence, draftPacket: draftPacketLocal } as const;
// Long tasks that shouldn't block the request when running locally.
const BACKGROUND = new Set<TaskName>(["draftPacket"]);
type TaskName = keyof typeof LOCAL;

export async function startTask<N extends TaskName>(name: N, args: Parameters<(typeof LOCAL)[N]>) {
  if (process.env.USE_RENDER_WORKFLOWS === "true") {
    const run = await new Render().workflows.startTask(`${process.env.WORKFLOW_SLUG ?? "cleared-wf"}/${name}`, args);
    return { mode: "workflow" as const, runId: run.taskRunId };
  }
  const run = () => (LOCAL[name] as (...a: unknown[]) => Promise<unknown>)(...args);
  if (BACKGROUND.has(name)) after(run);
  else await run();
  return { mode: "local" as const, runId: null };
}

/** Makes sure a dispute has an evidence packet being drafted (or drafted). Safe to call repeatedly. */
export async function ensureDraft(disputeId: string) {
  const { db, schema: s } = await import("@/db");
  const { desc, eq } = await import("drizzle-orm");
  const latest = await db.query.packets.findFirst({ where: eq(s.packets.disputeId, disputeId), orderBy: desc(s.packets.createdAt) });
  if (latest && latest.status !== "failed") return latest.id;
  const [packet] = await db.insert(s.packets).values({ disputeId, status: "gathering", trace: [] }).returning();
  const run = await startTask("draftPacket", [packet.id]);
  if (run.runId) await db.update(s.packets).set({ workflowRunId: run.runId }).where(eq(s.packets.id, packet.id));
  return packet.id;
}
