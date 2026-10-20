// Invoicing v2 (F2): create a draft from Cleared's invoice, send it, keep PayPal's payer link.
// Proven in scripts/spikes/03-invoice.mjs on 20 Oct 2026.
import "server-only";
import { paypal } from "./client";

export type InvoiceDraft = { items: { name: string; description?: string; quantity: string; unitAmount: string }[]; note?: string; terms?: string };

type PayPalInvoice = { id: string; status: string; detail: { invoice_number: string; metadata?: { recipient_view_url?: string } } };

export async function createAndSendInvoice(input: {
  workspaceTag: string;
  saleId: string;
  sellerName: string;
  clientName: string;
  clientEmail: string;
  draft: InvoiceDraft;
}) {
  const { invoice_number } = await paypal<{ invoice_number: string }>("POST", "/v2/invoicing/generate-next-invoice-number");
  const [given, ...rest] = input.sellerName.split(" ");
  const created = await paypal<PayPalInvoice>("POST", "/v2/invoicing/invoices", {
    body: {
      detail: {
        invoice_number,
        currency_code: "USD",
        // Tags every PayPal object with its workspace so shared-sandbox demo workspaces stay separate (FLOWS §1).
        reference: `ws:${input.workspaceTag}:${input.saleId}`.slice(0, 120),
        note: input.draft.note,
        terms_and_conditions: input.draft.terms,
        payment_term: { term_type: "DUE_ON_RECEIPT" },
      },
      invoicer: { name: { given_name: given, surname: rest.join(" ") || undefined }, email_address: process.env.PAYPAL_SANDBOX_BUSINESS_EMAIL },
      primary_recipients: [{ billing_info: { name: { full_name: input.clientName }, email_address: input.clientEmail } }],
      items: input.draft.items.map((it) => ({
        name: it.name.slice(0, 200),
        description: it.description?.slice(0, 1000),
        quantity: it.quantity,
        unit_amount: { currency_code: "USD", value: it.unitAmount },
        unit_of_measure: "AMOUNT",
      })),
    },
  });
  await paypal("POST", `/v2/invoicing/invoices/${created.id}/send`, { body: { send_to_invoicer: false } });
  const sent = await paypal<PayPalInvoice>("GET", `/v2/invoicing/invoices/${created.id}`);
  return { id: sent.id, number: sent.detail.invoice_number, status: sent.status, payerViewUrl: sent.detail.metadata?.recipient_view_url ?? null };
}
