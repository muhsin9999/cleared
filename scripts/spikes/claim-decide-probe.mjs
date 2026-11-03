// Sandbox probe, after a dispute was escalated to a claim: send evidence to the claim, wait for PayPal to put it
// under review, then ask PayPal to decide for the seller. node --env-file=.env.local scripts/spikes/claim-decide-probe.mjs PP-R-…
import { readFile } from "node:fs/promises";
import { pp, token } from "./paypal.mjs";
const id = process.argv[2];
const BASE = "https://api-m.sandbox.paypal.com";
const show = async () => { const { json: d } = await pp("GET", `/v1/customer/disputes/${id}`); const links = (d.links ?? []).map((l) => l.rel); console.log(new Date().toISOString().slice(11, 19), d.status, d.dispute_life_cycle_stage, d.dispute_outcome?.outcome_code ?? "", links.join(",")); return { d, links }; };
let { links } = await show();
if (links.includes("provide_evidence")) {
  const form = new FormData();
  form.append("input", new Blob([JSON.stringify({ evidences: [{ evidence_type: "PROOF_OF_FULFILLMENT", notes: "Final files delivered and the client confirmed receipt (sandbox probe)." }] })], { type: "application/json" }));
  form.append("evidence-file", new Blob([await readFile("public/demo/summer-static-cover-layers.pdf")], { type: "application/pdf" }), "summer-static-cover-layers.pdf");
  const res = await fetch(`${BASE}/v1/customer/disputes/${id}/provide-evidence`, { method: "POST", headers: { Authorization: `Bearer ${await token()}` }, body: form });
  console.log("provide-evidence:", res.status, res.headers.get("paypal-debug-id"), (await res.text()).slice(0, 200));
}
for (let i = 0; i < Number(process.env.TRIES ?? 18); i++) {
  ({ links } = await show());
  if (links.includes("adjudicate")) {
    const a = await pp("POST", `/v1/customer/disputes/${id}/adjudicate`, { body: { adjudication_outcome: "SELLER_FAVOR" } });
    console.log("adjudicate: ok", JSON.stringify(a.json ?? {}).slice(0, 120));
    for (let j = 0; j < 6; j++) { await new Promise((r) => setTimeout(r, 5000)); const { d } = await show(); if (d.status === "RESOLVED") break; }
    break;
  }
  await new Promise((r) => setTimeout(r, 10000));
}
