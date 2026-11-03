// Proves advanceSandboxDecision on a real sandbox dispute, end to end (escalate → evidence to the claim → PayPal's
// review → adjudicate). The dispute needn't be in this database. npx tsx --conditions=react-server --env-file=.env.local …
import "../../src/lib/net";
import { readFile } from "node:fs/promises";
import { advanceSandboxDecision } from "../../src/server/paypal/disputes";
import { paypalMultipart } from "../../src/server/paypal/client";
const id = process.argv[2];
const t0 = Date.now();
const log = (m: string) => console.log(`${Math.round((Date.now() - t0) / 1000)}s ${m}`);
let last = "";
for (let i = 0; i < 160; i++) {
  const r = await advanceSandboxDecision(id);
  if (r.step !== last) log(`${r.step} (${r.status})`);
  last = r.step;
  if (r.step === "decided") break;
  if (r.step === "resend") {
    const form = new FormData();
    form.append("input", new Blob([JSON.stringify({ evidences: [{ evidence_type: "PROOF_OF_FULFILLMENT", notes: "Final files delivered; the client confirmed receipt (sandbox test)." }] })], { type: "application/json" }));
    form.append("evidence-file", new Blob([await readFile("public/demo/summer-static-cover-layers.pdf")], { type: "application/pdf" }), "summer-static-cover-layers.pdf");
    await paypalMultipart(`/v1/customer/disputes/${id}/provide-evidence`, form);
    log("evidence sent to the claim");
  }
  await new Promise((r) => setTimeout(r, 20_000));
}
process.exit(0);
