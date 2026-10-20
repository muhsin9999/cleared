// Orders v2: create (CAPTURE) → buyer approves → capture → add tracking.
// node 04-order.mjs            create, print approve link
// node 04-order.mjs <orderId>  capture, then POST /v2/checkout/orders/{id}/track
import { mkdirSync, writeFileSync } from "node:fs";
import { pp, step } from "./paypal.mjs";
mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
const id = process.argv[2];

if (!id) {
  const { json } = await pp("POST", "/v2/checkout/orders", { headers: { "PayPal-Request-Id": crypto.randomUUID() }, body: {
    intent: "CAPTURE",
    purchase_units: [{ reference_id: "mug-set", custom_id: "ws:spike", description: "Hand-thrown mug set (2)",
      amount: { currency_code: "USD", value: "36.00" }    }],
    payment_source: { paypal: { experience_context: { shipping_preference: "GET_FROM_FILE", user_action: "PAY_NOW", return_url: "https://example.com/return", cancel_url: "https://example.com/cancel" } } },
  } });
  step("order created", json.status === "PAYER_ACTION_REQUIRED" || json.status === "CREATED", `${json.id} ${json.status}`);
  console.log("APPROVE LINK:", json.links.find((l) => l.rel === "payer-action" || l.rel === "approve").href);
  process.exit(0);
}
const { json: cap } = await pp("POST", `/v2/checkout/orders/${id}/capture`, { headers: { "PayPal-Request-Id": crypto.randomUUID() } });
const capture = cap.purchase_units[0].payments.captures[0];
step("order captured", cap.status === "COMPLETED", `capture ${capture.id} ${capture.status} seller_protection=${capture.seller_protection?.status}`);
writeFileSync(new URL("./out/capture.json", import.meta.url), JSON.stringify(cap, null, 2));
try {
  const { json: tr } = await pp("POST", `/v2/checkout/orders/${id}/track`, { body: {
    capture_id: capture.id, tracking_number: `1Z999AA1${Date.now().toString().slice(-8)}`, carrier: "UPS", notify_payer: false,
  } });
  const t = tr.purchase_units?.[0]?.shipping?.trackers?.[0];
  step("tracking added (/track)", !!t, `${t?.id} ${t?.status}`);
} catch (e) { step("tracking added (/track)", false, e.message); }
