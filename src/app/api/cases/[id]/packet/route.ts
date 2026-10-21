import { and, desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { currentSeller } from "@/server/auth";

// Live state of a case's newest evidence packet, polled by the case room while the agent works.
export async function GET(_request: Request, ctx: RouteContext<"/api/cases/[id]/packet">) {
  const seller = await currentSeller();
  if (!seller) return Response.json({ error: "Sign in again." }, { status: 401 });
  const { id } = await ctx.params;
  const dispute = await db.query.disputes.findFirst({ where: and(eq(s.disputes.id, id), eq(s.disputes.sellerId, seller.id)), columns: { id: true } });
  if (!dispute) return Response.json({ error: "Not found" }, { status: 404 });
  const p = await db.query.packets.findFirst({ where: eq(s.packets.disputeId, dispute.id), orderBy: desc(s.packets.createdAt) });
  const packet = p
    ? { status: p.status, source: p.source, model: p.model, recommendation: p.recommendation, rationale: p.rationale, claims: p.claims ?? [], removed: p.removedClaims ?? [], missing: p.missingEvidence ?? [], trace: p.trace ?? [], error: p.error }
    : null;
  return Response.json({ packet }, { headers: { "Cache-Control": "no-store" } });
}
