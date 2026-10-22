// Read-only check of the plugin's PayPal SDK against the real sandbox: takes the capture from a paid sandbox
// invoice (via its webhook event) and looks up the order behind it.
// Usage: npx tsx --conditions=react-server --env-file-if-exists=.env.local scripts/spikes/sdk-smoke.ts
import "../../src/lib/net";
import { paypal } from "../../src/server/paypal/client";
import { orderForCapture } from "../../src/server/paypal/tracking";
type Ev = { events: { event_type: string; resource: { invoice?: { payments?: { transactions?: { payment_id?: string }[] } } } }[] };
const { events } = await paypal<Ev>("GET", "/v1/notifications/webhooks-events?page_size=20&event_type=INVOICING.INVOICE.PAID&start_time=2026-10-01T00:00:00Z&end_time=2026-10-23T00:00:00Z");
const capture = events.flatMap((e) => e.resource.invoice?.payments?.transactions ?? []).find((t) => t.payment_id)?.payment_id;
if (!capture) throw new Error("no paid sandbox invoice found");
console.log("capture", `${capture.slice(0, 6)}…`, "→ order", await orderForCapture(capture));
process.exit(0);
