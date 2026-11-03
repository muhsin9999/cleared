import { describe as suite, expect, it } from "vitest";
import { describe, reasonText } from "../src/lib/paypal-events";

const ev = (event_type: string, resource: Record<string, unknown>) => ({ id: "WH-1", event_type, resource });

suite("PayPal event descriptions", () => {
  it("names the client and amount on a paid invoice", () => {
    expect(describe(ev("INVOICING.INVOICE.PAID", { payments: { paid_amount: { value: "40.00", currency_code: "USD" } } }), "Golden Hour Records")).toBe("Golden Hour Records paid $40");
  });
  it("reads invoice events, which PayPal wraps in resource.invoice", () => {
    expect(describe(ev("INVOICING.INVOICE.PAID", { invoice: { id: "INV2-X", payments: { paid_amount: { value: "40.00", currency_code: "USD" } } } }), "Northwind Games")).toBe("Northwind Games paid $40");
  });
  it("explains dispute reasons in plain words", () => {
    expect(describe(ev("CUSTOMER.DISPUTE.CREATED", { reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED" }), "Rowan Hale")).toBe("Rowan Hale opened a dispute: “not received”");
    expect(reasonText("SOME_NEW_REASON")).toBe("some new reason");
  });
  it("says who a resolved dispute favored", () => {
    expect(describe(ev("CUSTOMER.DISPUTE.RESOLVED", { dispute_outcome: { outcome_code: "RESOLVED_SELLER_FAVOUR" } }))).toBe("Dispute closed in your favor");
    expect(describe(ev("CUSTOMER.DISPUTE.RESOLVED", { dispute_outcome: { outcome_code: "RESOLVED_BUYER_FAVOUR" } }))).toBe("Dispute closed in the buyer’s favor");
  });
  it("falls back to a readable name for unknown events", () => {
    expect(describe(ev("PAYMENT.PAYOUTS-ITEM.SUCCEEDED", {}))).toBe("payment · payouts-item · succeeded");
  });
});
