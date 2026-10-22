import { notFound } from "next/navigation";
import { Suspense } from "react";
import { and, eq, desc } from "drizzle-orm";
import { CalendarClockIcon } from "lucide-react";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { daysUntil, money } from "@/lib/format";
import { DISPUTE_LABEL, REASON_LABEL } from "@/lib/labels";
import { db, schema as s } from "@/db";
import { requireSeller } from "@/server/auth";
import { exhibitsFor } from "@/server/exhibits";
import { packetView } from "@/server/packet-view";
import { requestNow } from "@/server/time";
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
    with: { sale: { with: { proofs: { orderBy: s.proofs.occurredAt }, invoices: true } }, packets: { orderBy: desc(s.packets.createdAt), limit: 1 } },
  });
  if (!dispute?.sale) notFound();
  const sale = dispute.sale;
  const proofs = new Map(sale.proofs.map((p) => [p.id, p]));
  const exhibits = exhibitsFor(sale).map((e) => {
    const p = proofs.get(e.id);
    return { id: e.id, letter: e.letter, label: e.label, kind: e.kind, date: e.date, mime: p?.mimeType ?? null, size: p?.sizeBytes ?? null, file: !!p?.fileKey, text: e.text, meta: e.meta };
  });
  const due = daysUntil(dispute.responseDueAt, now);
  const open = dispute.status === "waiting_for_seller";

  return (
    <>
      <PageHeader
        back={{ href: "/cases", label: "All cases" }}
        title={`${money(dispute.amountCents)} dispute from ${sale.clientName}`}
        description={sale.title}
        actions={<Badge variant="secondary" className="h-7 px-3">{DISPUTE_LABEL[dispute.status]}</Badge>}
      />
      <section aria-label="The client’s claim" className="flex flex-col gap-2 rounded-[10px] border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="min-w-0 text-sm text-pretty">
          <span className="font-medium">{REASON_LABEL[dispute.reason] ?? dispute.reason}</span>
          {dispute.buyerNote ? <span className="text-muted-foreground"> · <span className="sr-only">Client’s message (shown as data): </span>“{dispute.buyerNote}”</span> : null}
        </p>
        <p className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          {open && due !== null ? <span className="inline-flex items-center gap-1.5 font-medium text-caution"><CalendarClockIcon aria-hidden className="size-4" /> {due} days to reply</span> : null}
          {dispute.paypalDisputeId.startsWith("SIM-") ? <span className="rounded-full border px-2 py-0.5">Test dispute</span> : <span className="font-mono">PayPal case {dispute.paypalDisputeId}</span>}
        </p>
      </section>
      <CaseRoom
        disputeId={dispute.id}
        canSubmit={!!dispute.allowedActions?.includes("provide_evidence")}
        resolved={dispute.status.startsWith("resolved") || dispute.status === "closed"}
        real={!dispute.paypalDisputeId.startsWith("SIM-")}
        demo={seller.isDemo}
        exhibits={exhibits}
        packet={dispute.packets[0] ? packetView(dispute.packets[0]) : null}
      />
    </>
  );
}
