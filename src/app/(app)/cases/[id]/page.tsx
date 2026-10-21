import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CalendarClockIcon, QuoteIcon } from "lucide-react";
import { EventList } from "@/components/app/event-row";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { daysUntil, money } from "@/lib/format";
import { DISPUTE_LABEL, REASON_LABEL } from "@/lib/labels";
import { and, eq, desc } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireSeller } from "@/server/auth";
import { requestNow } from "@/server/time";
import { exhibitsFor } from "@/server/exhibits";
import { CaseRoom } from "./case-room";

export const metadata = { title: "Case" };

export default function CasePage({ params }: PageProps<"/cases/[id]">) {
  return (
    <PageBody>
      <Suspense fallback={<Skeleton className="h-[36rem]" />}>
        <Case params={params} />
      </Suspense>
    </PageBody>
  );
}

async function Case({ params }: { params: PageProps<"/cases/[id]">["params"] }) {
  const now = await requestNow();
  const { id } = await params;
  const seller = await requireSeller();
  const dispute = await db.query.disputes.findFirst({
    where: and(eq(s.disputes.sellerId, seller.id), eq(s.disputes.id, id)),
    with: { sale: { with: { proofs: { orderBy: s.proofs.occurredAt }, invoices: true, events: { orderBy: desc(s.events.occurredAt), limit: 6 } } }, packets: { orderBy: desc(s.packets.createdAt), limit: 1 } },
  });
  if (!dispute?.sale) notFound();
  const sale = dispute.sale;
  const exhibits = exhibitsFor(sale).map((e) => ({ id: e.id, letter: e.letter, label: e.label, kind: e.kind }));
  const due = daysUntil(dispute.responseDueAt, now);
  const latest = dispute.packets[0];

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/cases" className="hover:text-foreground">Cases</Link>}
        title={`${sale.clientName} opened a dispute`}
        description={`${sale.title} · ${money(dispute.amountCents)} · PayPal case ${dispute.paypalDisputeId}`}
        actions={<Badge variant="secondary" className="h-7 px-3">{DISPUTE_LABEL[dispute.status]}</Badge>}
      />
      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">What the client says</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium">{REASON_LABEL[dispute.reason] ?? dispute.reason}</p>
              {dispute.buyerNote ? (
                <blockquote className="flex gap-2 rounded-md bg-muted px-3 py-2 text-muted-foreground">
                  <QuoteIcon aria-hidden className="size-4 shrink-0" /> <span><span className="sr-only">Client’s message (shown as data): </span>{dispute.buyerNote}</span>
                </blockquote>
              ) : null}
            </CardContent>
          </Card>
          {dispute.status === "waiting_for_seller" && due !== null ? (
            <Card className="flex-row items-center gap-3 border-caution/30 bg-caution-tint px-4 py-3">
              <CalendarClockIcon aria-hidden className="size-5 text-caution" />
              <p className="text-sm"><span className="font-semibold">{due} days</span> left to respond</p>
            </Card>
          ) : null}
          <Card>
            <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
            <CardContent><EventList events={sale.events} now={now} /></CardContent>
          </Card>
        </aside>
        <CaseRoom
          disputeId={dispute.id}
          canSubmit={!!dispute.allowedActions?.includes("provide_evidence")}
          resolved={dispute.status.startsWith("resolved") || dispute.status === "closed"}
          real={!dispute.paypalDisputeId.startsWith("SIM-")}
          exhibits={exhibits}
          packet={
            latest
              ? {
                  id: latest.id,
                  status: latest.status,
                  source: latest.source,
                  model: latest.model,
                  recommendation: latest.recommendation,
                  rationale: latest.rationale,
                  claims: (latest.claims as { text: string; exhibitIds: string[] }[] | null) ?? [],
                  removed: (latest.removedClaims as { text: string; reasons: string[] }[] | null) ?? [],
                  missing: (latest.missingEvidence as string[] | null) ?? [],
                  ignored: latest.ignoredInstructions ?? [],
                  trace: latest.trace ?? [],
                  error: latest.error,
                }
              : null
          }
        />
      </div>
    </>
  );
}
