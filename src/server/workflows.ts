// Starts Render Workflow tasks. On Render (USE_RENDER_WORKFLOWS=true) tasks run on the cleared-wf service;
// locally they run in-process so development doesn't touch the hosted workflow or its database.
import "server-only";
import { Render } from "@renderinc/sdk";
import { submitEvidence } from "./paypal/evidence";

const LOCAL = { submitEvidence } as const;
type TaskName = keyof typeof LOCAL;

export async function startTask<N extends TaskName>(name: N, args: Parameters<(typeof LOCAL)[N]>) {
  if (process.env.USE_RENDER_WORKFLOWS === "true") {
    const run = await new Render().workflows.startTask(`${process.env.WORKFLOW_SLUG ?? "cleared-wf"}/${name}`, args);
    return { mode: "workflow" as const, runId: run.taskRunId };
  }
  await (LOCAL[name] as (...a: unknown[]) => Promise<unknown>)(...args);
  return { mode: "local" as const, runId: null };
}
