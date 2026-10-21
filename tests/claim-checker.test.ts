import { describe, expect, it } from "vitest";
import { checkClaims } from "../src/lib/claim-checker";

const exhibits = [
  { letter: "A", kind: "message", label: "Agreed scope (email thread)", date: "2026-10-13T12:00:00Z", text: "Square cover, 2 revision rounds" },
  { letter: "B", kind: "file", label: "harmattan-cover-final.png", date: "2026-10-18T15:00:00Z" },
  { letter: "C", kind: "acceptance", label: "Client confirmed receipt", date: "2026-10-18T18:00:00Z" },
];
const sale = { amountCents: 25_000 };

describe("claim checker", () => {
  it("keeps a claim whose facts match its exhibits", () => {
    const [c] = checkClaims([{ text: "The final file harmattan-cover-final.png was delivered on Oct 18 for $250.", exhibits: ["B"] }], exhibits, sale);
    expect(c.ok).toBe(true);
  });
  it("strikes a claim with no citation", () => {
    expect(checkClaims([{ text: "The client was happy.", exhibits: [] }], exhibits, sale)[0].reasons).toContain("cites no exhibit");
  });
  it("strikes a claim citing an exhibit that doesn't exist", () => {
    expect(checkClaims([{ text: "Tracking shows delivery.", exhibits: ["F"] }], exhibits, sale)[0].ok).toBe(false);
  });
  it("strikes a claim whose date isn't in the cited exhibit", () => {
    const [c] = checkClaims([{ text: "The client confirmed receipt on Oct 20.", exhibits: ["C"] }], exhibits, sale);
    expect(c.ok).toBe(false);
    expect(c.reasons[0]).toMatch(/date/);
  });
  it("strikes an invented amount and an invented file name", () => {
    const [c] = checkClaims([{ text: "They paid $300 and received final-v2.png.", exhibits: ["B"] }], exhibits, sale);
    expect(c.reasons.join(" ")).toMatch(/amount/);
    expect(c.reasons.join(" ")).toMatch(/file/);
  });
});
