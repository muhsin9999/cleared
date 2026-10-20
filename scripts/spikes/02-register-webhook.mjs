import { writeFileSync } from "node:fs";
import { pp, step } from "./paypal.mjs";
const url = process.argv[2];
if (!url) throw new Error("usage: 02-register-webhook.mjs https://<public-url>");
const { json: list } = await pp("GET", "/v1/notifications/webhooks");
for (const w of list.webhooks ?? []) {
  if (w.url.includes("trycloudflare.com")) { await pp("DELETE", `/v1/notifications/webhooks/${w.id}`); console.log("removed old tunnel webhook", w.id); }
}
const events = ["INVOICING.INVOICE.PAID", "INVOICING.INVOICE.CANCELLED", "PAYMENT.CAPTURE.COMPLETED", "CHECKOUT.ORDER.APPROVED",
  "CUSTOMER.DISPUTE.CREATED", "CUSTOMER.DISPUTE.UPDATED", "CUSTOMER.DISPUTE.RESOLVED"].map((name) => ({ name }));
const { json } = await pp("POST", "/v1/notifications/webhooks", { body: { url, event_types: events } });
writeFileSync(new URL("./.webhook-id", import.meta.url), json.id);
step("webhook registered", !!json.id, `${json.id} → ${url} (${events.length} events)`);
