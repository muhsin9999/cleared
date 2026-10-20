import { describe, expect, it } from "vitest";
import { preflight, type SaleDraft } from "../src/lib/preflight";

const history = { pastSales: 3, averageCents: 6_167, accountAgeDays: 74 };
const ada: SaleDraft = {
  clientName: "Northwind Games",
  clientEmail: "art@northwind.example",
  title: "Character sheet: 3 poses",
  description: "Character sheet for our game's main hero",
  kind: "digital",
  amountCents: 40_000,
  depositPercent: null,
  deliveryDays: null,
  refundTerms: "",
};

describe("preflight", () => {
  it("flags Ada's $400 jump as a risk against her history", () => {
    const { findings, score } = preflight(ada, history);
    expect(findings.find((f) => f.id === "spike")).toMatchObject({ severity: "risk", ruleRef: "K8" });
    expect(findings.map((f) => f.id)).toEqual(expect.arrayContaining(["delivery", "vague", "refunds", "protection"]));
    expect(score).toBeLessThan(50);
  });

  it("reaches a ready score once every one-click fix is applied", () => {
    let draft = ada;
    for (const f of preflight(draft, history).findings) if (f.fix) draft = { ...draft, ...f.fix.patch };
    const { score, findings } = preflight(draft, history);
    expect(score).toBeGreaterThanOrEqual(85);
    expect(findings.map((f) => f.id)).not.toContain("delivery");
  });

  it("does not flag a spike for a seller with no history", () => {
    expect(preflight(ada, { pastSales: 0, averageCents: null, accountAgeDays: 1 }).findings.map((f) => f.id)).not.toContain("spike");
  });

  it("asks for signature confirmation on goods of $750 or more", () => {
    const goods = { ...ada, kind: "physical" as const, amountCents: 80_000, deliveryDays: 5, refundTerms: "30-day returns", description: "Hand-thrown mug set of 4, shipped insured with tracking" };
    expect(preflight(goods, history).findings.map((f) => f.id)).toContain("signature");
  });
});
