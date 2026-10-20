import { and, desc, eq, gt } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { currentSeller } from "@/server/auth";

// Lightweight poll for the live timeline: events for the signed-in seller newer than `after`.
export async function GET(request: Request) {
  const seller = await currentSeller();
  if (!seller) return Response.json({ events: [] }, { status: 401 });
  const after = new URL(request.url).searchParams.get("after");
  const since = after ? new Date(after) : new Date(Date.now() - 60_000);
  const events = await db
    .select({ id: s.events.id, type: s.events.type, summary: s.events.summary, occurredAt: s.events.occurredAt, saleId: s.events.saleId })
    .from(s.events)
    .where(and(eq(s.events.sellerId, seller.id), gt(s.events.receivedAt, since)))
    .orderBy(desc(s.events.receivedAt))
    .limit(10);
  return Response.json({ events, now: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
