// Local webhook receiver for spikes: verifies each event with PayPal and appends it to webhook-events.jsonl.
import http from "node:http";
import { appendFileSync, readFileSync, existsSync } from "node:fs";
import { pp, step } from "./paypal.mjs";

const OUT = new URL("./webhook-events.jsonl", import.meta.url);
const webhookId = () => process.env.PAYPAL_WEBHOOK_ID || (existsSync(new URL("./.webhook-id", import.meta.url)) ? readFileSync(new URL("./.webhook-id", import.meta.url), "utf8").trim() : "");

http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", async () => {
    res.writeHead(200).end();
    if (req.method !== "POST") return;
    const event = JSON.parse(raw || "{}");
    let verification = "SKIPPED";
    try {
      const h = req.headers;
      const { json } = await pp("POST", "/v1/notifications/verify-webhook-signature", {
        body: {
          auth_algo: h["paypal-auth-algo"], cert_url: h["paypal-cert-url"], transmission_id: h["paypal-transmission-id"],
          transmission_sig: h["paypal-transmission-sig"], transmission_time: h["paypal-transmission-time"],
          webhook_id: webhookId(), webhook_event: event,
        },
      });
      verification = json.verification_status;
    } catch (e) { verification = `ERROR ${e.message.slice(0, 200)}`; }
    appendFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), verification, id: event.id, type: event.event_type, resource: event.resource }) + "\n");
    step(`webhook ${event.event_type}`, verification === "SUCCESS", `${event.id} verify=${verification}`);
  });
}).listen(8787, () => console.log("listening on :8787"));
