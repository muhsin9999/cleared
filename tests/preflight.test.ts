import { describe, expect, it } from "vitest";
import { applyFix, type Finding, fixApplied, hasPlaceholder, preflight, type SaleDraft, scoreWith } from "../src/lib/preflight";

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
    for (const f of preflight(draft, history).findings) if (f.fix) draft = applyFix(draft, f.fix);
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

  it("stacks two fixes to the description instead of the second wiping the first (review, 3 Nov)", () => {
    const rights: Finding = { id: "ai-0", severity: "caution", title: "Usage rights aren’t stated", reason: "", ruleRef: "K16", weight: 6, source: "ai", fix: { label: "State the usage rights", add: { field: "description", text: "The client may use the art commercially." } } };
    const fixable = [...preflight(ada, history).findings, rights].filter((f) => f.fix);
    const once = fixable.reduce((d, f) => applyFix(d, f.fix!), ada);
    expect(once.description).toContain("Character sheet for our game's main hero.");
    expect(once.description).toContain("Delivered as PNG");
    expect(once.description).toContain("The client may use the art commercially.");
    expect(fixApplied(once, rights.fix!)).toBe(true);
    expect(preflight(once, history).findings.map((f) => f.id)).not.toContain("vague");
    expect(scoreWith(preflight(once, history), [rights], once)).toBeGreaterThanOrEqual(85);
    // Pressing it again changes nothing.
    expect(fixable.reduce((d, f) => applyFix(d, f.fix!), once)).toEqual(once);
  });

  it("spots template gaps a model may leave in a suggested fix", () => {
    expect(hasPlaceholder("delivered as final digital artwork in [file format(s)]")).toBe(true);
    expect(hasPlaceholder("Size: {width} px")).toBe(true);
    expect(hasPlaceholder("Delivery date TBD")).toBe(true);
    expect(hasPlaceholder("Delivered as PNG (3000×3000 px), 2 revision rounds.")).toBe(false);
  });
});
