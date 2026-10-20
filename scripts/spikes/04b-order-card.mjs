// Orders v2 paid with a sandbox test card (no buyer click), then add tracking.
// Also creates a plain PayPal order with the classic approve link as a second route.
import { pp, step } from "./paypal.mjs";
const pu = { reference_id: "mug-set", custom_id: "ws:spike", description: "Hand-thrown mug set (2)", amount: { currency_code: "USD", value: "36.00" } };
try {
  const { json } = await pp("POST", "/v2/checkout/orders", { headers: { "PayPal-Request-Id": crypto.randomUUID() }, body: {
    intent: "CAPTURE", purchase_units: [pu],
    payment_source: { card: { number: "4032039317984658", expiry: "2030-12", security_code: "123", name: "Test Buyer",
      billing_address: { address_line_1: "1 Main St", admin_area_2: "San Jose", admin_area_1: "CA", postal_code: "95131", country_code: "US" } } },
  } });
  const cap = json.purchase_units?.[0]?.payments?.captures?.[0];
  step("card order captured (no buyer click)", json.status === "COMPLETED", `${json.id} ${json.status} capture ${cap?.id} ${cap?.status}`);
  if (cap) {
    try {
      const { json: tr } = await pp("POST", `/v2/checkout/orders/${json.id}/track`, { body: { capture_id: cap.id, tracking_number: `1Z999AA1${Date.now().toString().slice(-8)}`, carrier: "UPS", notify_payer: false } });
      const t = tr.purchase_units?.[0]?.shipping?.trackers?.[0];
      step("tracking added (/track)", !!t, `${t?.id} ${t?.status}`);
    } catch (e) { step("tracking added (/track)", false, e.message.slice(0, 400)); }
  }
} catch (e) { step("card order", false, e.message.slice(0, 500)); }

const { json: o } = await pp("POST", "/v2/checkout/orders", { body: { intent: "CAPTURE", purchase_units: [pu],
  application_context: { return_url: "https://example.com/return", cancel_url: "https://example.com/cancel" } } });
step("classic PayPal order created", o.status === "CREATED", o.id);
console.log("CLASSIC APPROVE LINK:", o.links.find((l) => l.rel === "approve").href);
