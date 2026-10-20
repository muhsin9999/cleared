import { describe, expect, it } from "vitest";
import { SAMPLE_NOTICES } from "../src/lib/notice-samples";
import { readNotice } from "../src/lib/notice";

const locker = { invoices: 5, deliveredFiles: 4, acceptances: 4, tracking: 0, messages: 1, terms: 2 };
const now = new Date("2026-10-20T12:00:00Z");

describe("notice reader", () => {
  it("flags the fake email as phishing and explains why", () => {
    const r = readNotice(SAMPLE_NOTICES.phishing.text, "no", locker, now);
    expect(r.verdict).toBe("likely_phishing");
    expect(r.signals.map((s) => s.id)).toEqual(expect.arrayContaining(["sender", "lookalike", "links", "secrets", "fee", "rc-missing", "greeting", "urgency"]));
    expect(r.requirements).toEqual([]);
  });

  it("treats the Resolution Center notice as genuine and maps the requests to the locker", () => {
    const r = readNotice(SAMPLE_NOTICES.genuine.text, "yes", locker, now);
    expect(r.verdict).toBe("genuine");
    expect(r.type).toBe("limitation");
    expect(r.deadline?.days).toBe(10);
    const byKey = Object.fromEntries(r.requirements.map((q) => [q.key, q.status]));
    expect(byKey).toMatchObject({ invoices: "ready", fulfilment: "ready", business: "you" });
  });

  it("never calls an email genuine just because it looks clean, without the Resolution Center", () => {
    expect(readNotice(SAMPLE_NOTICES.genuine.text, "unsure", locker, now).verdict).toBe("unsure");
  });

  it("one strong signal is enough, even if the seller says it's in the Resolution Center", () => {
    expect(readNotice("From: service@paypal.com\nPlease reply with your password.", "yes", locker, now).verdict).toBe("likely_phishing");
  });

  it("marks proof the seller doesn't have yet as missing", () => {
    const r = readNotice("From: service@paypal.com\nPlease upload tracking information for your shipped orders.", "yes", { ...locker, tracking: 0 }, now);
    expect(r.requirements.find((q) => q.key === "tracking")?.status).toBe("missing");
  });
});
