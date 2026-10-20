// Plain-English descriptions of PayPal webhook events, shared by the webhook route and tests.
import { money } from "./format";

export type WebhookEvent = { id: string; event_type: string; create_time?: string; resource_type?: string; resource: Record<string, unknown> };

type Amount = { value?: string; currency_code?: string };
export const cents = (a?: Amount) => (a?.value ? Math.round(Number(a.value) * 100) : null);
const amountText = (a?: Amount) => (cents(a) !== null ? money(cents(a)!, a?.currency_code ?? "USD") : "");

type Resource = {
  amount?: Amount;
  payments?: { paid_amount?: Amount };
  reason?: string;
  status?: string;
  dispute_outcome?: { outcome_code?: string };
};

/** Plain-English line for the timeline. Unknown types fall back to a readable version of the name. */
export function describe(event: WebhookEvent, clientName?: string | null) {
  const r = event.resource as Resource;
  const who = clientName ?? "Your client";
  switch (event.event_type) {
    case "INVOICING.INVOICE.PAID":
      return `${who} paid ${amountText(r.payments?.paid_amount ?? r.amount)}`.trim();
    case "INVOICING.INVOICE.CANCELLED":
      return "The invoice was cancelled";
    case "CHECKOUT.ORDER.APPROVED":
      return `${who} approved the payment`;
    case "PAYMENT.CAPTURE.COMPLETED":
      return `${amountText(r.amount)} payment received`.trim();
    case "CUSTOMER.DISPUTE.CREATED":
      return `${who} opened a dispute${r.reason ? `: ${reasonText(r.reason)}` : ""}`;
    case "CUSTOMER.DISPUTE.UPDATED":
      return `The dispute was updated (${(r.status ?? "").toLowerCase().replaceAll("_", " ")})`;
    case "CUSTOMER.DISPUTE.RESOLVED": {
      const outcome = r.dispute_outcome?.outcome_code ?? "";
      return outcome.includes("SELLER") ? "Dispute closed in your favour" : outcome.includes("BUYER") ? "Dispute closed in the buyer’s favour" : "Dispute closed";
    }
    default:
      return event.event_type.toLowerCase().replaceAll("_", " ").replaceAll(".", " · ");
  }
}

export function reasonText(reason: string) {
  return (
    { MERCHANDISE_OR_SERVICE_NOT_RECEIVED: "“not received”", MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED: "“not as described”", UNAUTHORISED: "“unauthorised payment”" } as Record<string, string>
  )[reason] ?? reason.toLowerCase().replaceAll("_", " ");
}

