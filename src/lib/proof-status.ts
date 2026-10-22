// A tracking proof is written as a claim before Cleared asks PayPal (so two clicks can't add it twice), and it
// only counts as proof once PayPal confirmed it. Claims still "sending", or whose answer never came back
// ("unconfirmed"), are not evidence and don't count towards coverage.
export const PENDING_TRACKING = new Set(["sending", "unconfirmed"]);

export function isConfirmedProof(p: { kind: string; meta?: unknown }) {
  return p.kind !== "tracking" || !PENDING_TRACKING.has(String((p.meta as { status?: unknown } | null)?.status ?? ""));
}
