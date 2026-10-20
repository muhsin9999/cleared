import { describe, expect, it } from "vitest";
import { checkEvidenceFile } from "../src/lib/evidence-files";

describe("evidence file rules (PayPal: JPG/PNG/GIF/PDF, ≤10 MB)", () => {
  it("accepts a PNG under 10 MB", () => expect(checkEvidenceFile({ type: "image/png", size: 6_400_000 })).toBeNull());
  it("rejects types PayPal won't take", () => expect(checkEvidenceFile({ type: "application/zip", size: 100 })).toMatch(/JPG, PNG, GIF or PDF/));
  it("rejects files over 10 MB with the size", () => expect(checkEvidenceFile({ type: "application/pdf", size: 12 * 1024 * 1024 })).toMatch(/12\.0 MB/));
  it("rejects empty files", () => expect(checkEvidenceFile({ type: "image/jpeg", size: 0 })).toMatch(/empty/));
});
