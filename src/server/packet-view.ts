// The case room's view of an evidence packet, shared by the case page and the polling endpoint.
import type { schema as s } from "@/db";

export function packetView(p: typeof s.packets.$inferSelect) {
  return {
    id: p.id,
    status: p.status,
    source: p.source,
    model: p.model,
    recommendation: p.recommendation,
    rationale: p.rationale,
    claims: (p.claims as { text: string; exhibitIds: string[] }[] | null) ?? [],
    removed: (p.removedClaims as { text: string; reasons: string[] }[] | null) ?? [],
    missing: (p.missingEvidence as string[] | null) ?? [],
    ignored: p.ignoredInstructions ?? [],
    trace: p.trace ?? [],
    error: p.error,
    startedAt: p.createdAt.toISOString(),
  };
}
export type PacketView = ReturnType<typeof packetView>;
