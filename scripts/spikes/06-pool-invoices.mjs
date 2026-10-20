// Creates $250 invoices to the sandbox buyer. Pay each as the buyer, then open a "not received" dispute on it:
// those disputes become the judge-mode stock. Usage: node --env-file=.env.local scripts/spikes/06-pool-invoices.mjs 3
import { pp } from "./paypal.mjs";
const n = Number(process.argv[2] ?? 3);
for (let i = 0; i < n; i++) {
  const { json: num } = await pp("POST", "/v2/invoicing/generate-next-invoice-number");
  const { json: draft } = await pp("POST", "/v2/invoicing/invoices", { body: {
    detail: { invoice_number: num.invoice_number, currency_code: "USD", reference: "pool:judge-dispute", note: "Album cover artwork, 3000×3000 px, layered source, 2 revision rounds.", payment_term: { term_type: "DUE_ON_RECEIPT" } },
    invoicer: { name: { given_name: "Okafor", surname: "Studio" }, email_address: process.env.PAYPAL_SANDBOX_BUSINESS_EMAIL },
    primary_recipients: [{ billing_info: { email_address: process.env.PAYPAL_SANDBOX_BUYER_EMAIL } }],
    items: [{ name: "Album cover: “Harmattan Tapes”", quantity: "1", unit_amount: { currency_code: "USD", value: "250.00" }, unit_of_measure: "AMOUNT" }],
  } });
  await pp("POST", `/v2/invoicing/invoices/${draft.id}/send`, { body: { send_to_invoicer: false } });
  const { json: inv } = await pp("GET", `/v2/invoicing/invoices/${draft.id}`);
  console.log(`#${num.invoice_number}  ${inv.detail.metadata.recipient_view_url}`);
}
