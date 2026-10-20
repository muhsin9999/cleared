// Invoicing v2: create a draft, send it, print the payer link. Re-run with an id to check status.
import { mkdirSync, writeFileSync } from "node:fs";
import { pp, step } from "./paypal.mjs";
mkdirSync(new URL("./out/", import.meta.url), { recursive: true });

if (process.argv[2]) {
  const { json } = await pp("GET", `/v2/invoicing/invoices/${process.argv[2]}`);
  step("invoice status", json.status === "PAID", `${json.status}; payments: ${JSON.stringify(json.payments?.transactions ?? [])}`);
  process.exit(0);
}
const { json: num } = await pp("POST", "/v2/invoicing/generate-next-invoice-number");
const { json: draft } = await pp("POST", "/v2/invoicing/invoices", { body: {
  detail: { invoice_number: num.invoice_number, currency_code: "USD", reference: "ws:spike",
    note: "Character sheet commission: 3 poses, 2 revisions, delivered as PNG within 10 days.",
    terms_and_conditions: "Refunds available until the first sketch is delivered.", payment_term: { term_type: "DUE_ON_RECEIPT" } },
  invoicer: { name: { given_name: "Ada", surname: "Okafor" }, email_address: process.env.PAYPAL_SANDBOX_BUSINESS_EMAIL },
  primary_recipients: [{ billing_info: { email_address: process.env.PAYPAL_SANDBOX_BUYER_EMAIL } }],
  items: [{ name: "Character sheet: 3 poses", description: "Full colour, 2 revision rounds", quantity: "1", unit_amount: { currency_code: "USD", value: "40.00" }, unit_of_measure: "AMOUNT" }],
} });
step("invoice draft created", draft.status === "DRAFT", `${draft.id} #${num.invoice_number}`);
const { json: sent } = await pp("POST", `/v2/invoicing/invoices/${draft.id}/send`, { body: { send_to_invoicer: true } });
const { json: inv } = await pp("GET", `/v2/invoicing/invoices/${draft.id}`);
step("invoice sent", inv.status === "SENT" || inv.status === "UNPAID", inv.status);
writeFileSync(new URL("./out/invoice.json", import.meta.url), JSON.stringify(inv, null, 2));
console.log("PAY LINK:", inv.detail?.metadata?.recipient_view_url ?? sent.href);
