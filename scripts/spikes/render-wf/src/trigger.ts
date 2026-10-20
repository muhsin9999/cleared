// Starts onDisputeCreated the same way the web service will, then waits for the result.
import { Render } from "@renderinc/sdk";

const render = new Render();
const started = await render.workflows.startTask(`${process.env.WORKFLOW_SLUG ?? "cleared-wf"}/onDisputeCreated`, ["PP-D-SPIKE"]);
console.log("started", started.taskRunId);
const run = await started.get();
console.log(run.status === "completed" ? "PASS" : "FAIL", " workflow onDisputeCreated —", run.status, JSON.stringify(run.results));
