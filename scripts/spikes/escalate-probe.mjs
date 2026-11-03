// Sandbox probe: escalate an inquiry to a claim, wait for PayPal to offer `adjudicate`, then decide for the seller.
// node --env-file=.env.local scripts/spikes/escalate-probe.mjs PP-R-…
import { pp } from "./paypal.mjs";
const id = process.argv[2];
const show = async () => { const { json: d } = await pp("GET", `/v1/customer/disputes/${id}`); const links = (d.links ?? []).map((l) => l.rel); console.log(new Date().toISOString().slice(11, 19), d.status, d.dispute_life_cycle_stage, links.join(",")); return links; };
await show();
const e = await pp("POST", `/v1/customer/disputes/${id}/escalate`, { body: { note: "Sandbox demo: escalating so PayPal can decide." } });
console.log("escalate:", e.status ?? "", JSON.stringify(e.json ?? {}).slice(0, 200));
for (let i = 0; i < 12; i++) {
  const links = await show();
  if (links.includes("adjudicate")) {
    const a = await pp("POST", `/v1/customer/disputes/${id}/adjudicate`, { body: { adjudication_outcome: "SELLER_FAVOR" } });
    console.log("adjudicate:", a.status ?? "", JSON.stringify(a.json ?? {}).slice(0, 200));
    await new Promise((r) => setTimeout(r, 5000)); await show(); break;
  }
  await new Promise((r) => setTimeout(r, 10000));
}
