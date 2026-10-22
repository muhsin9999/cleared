// Compares the registered PayPal webhooks with PAYPAL_WEBHOOK_ID locally and on Render (prints matches, never values).
import { pp } from "./paypal.mjs";
const { json } = await pp("GET", "/v1/notifications/webhooks");
const local = process.env.PAYPAL_WEBHOOK_ID;
for (const w of json.webhooks) console.log(w.url, "events:", w.event_types.length, "matches local id:", w.id === local);
const h = { Authorization: `Bearer ${process.env.RENDER_API_KEY}`, Accept: "application/json" };
const services = await (await fetch("https://api.render.com/v1/services?limit=50", { headers: h })).json();
for (const { service } of services) {
  if (service.type !== "web_service") continue;
  const vars = await (await fetch(`https://api.render.com/v1/services/${service.id}/env-vars?limit=100`, { headers: h })).json();
  const v = vars.find((x) => x.envVar.key === "PAYPAL_WEBHOOK_ID")?.envVar.value;
  console.log("render", service.name, "has id:", !!v, "matches a registered webhook:", json.webhooks.some((w) => w.id === v), "matches local:", v === local);
}
