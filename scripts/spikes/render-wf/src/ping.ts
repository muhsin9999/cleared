import { Render } from "@renderinc/sdk";
const run = await new Render().workflows.startTask("cleared-wf/ping", []);
const done = await run.get();
console.log(done.status === "completed" ? "PASS" : "FAIL", "hosted workflow ping —", done.status, JSON.stringify(done.results));
