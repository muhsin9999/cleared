import Link from "next/link";
import { Suspense } from "react";
import { and, desc, eq } from "drizzle-orm";
import { CheckCircle2Icon, CircleSlashIcon, SendIcon, UserCheckIcon } from "lucide-react";
import { AgentMark } from "@/components/brand/marks";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { WebhookHealth } from "@/components/app/webhook-health";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db, schema as s } from "@/db";
import { costOf } from "@/lib/ai-cost";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireSeller } from "@/server/auth";
import { requestNow } from "@/server/time";

export const metadata = { title: "AI audit log" };

const KIND: Record<string, { label: string; ai: boolean }> = {
  "ai.packet.draft": { label: "Investigated a dispute and drafted the evidence packet", ai: true },
  "ai.preflight": { label: "Read a sale before invoicing (pre-flight)", ai: true },
  "ai.notice.transcribe": { label: "Read a screenshot of a PayPal email", ai: true },
  "ai.notice.reply": { label: "Wrote a reply to a PayPal notice", ai: true },
  "paypal.invoice.send": { label: "Sent an invoice through PayPal", ai: false },
  "paypal.tracking.add": { label: "Sent tracking to PayPal", ai: false },
  "paypal.dispute.provide_evidence": { label: "Sent evidence to PayPal", ai: false },
};

type Usage = { input?: number; output?: number; cached?: number };
type Output = { usage?: Usage; promptVersion?: string; ms?: number; findings?: { title: string; source?: string }[]; recommendation?: string; claims?: { text: string }[]; reply?: string; introduced?: string[]; files?: string[]; paypalStatus?: string; number?: string };

export default function AuditPage({ searchParams }: PageProps<"/settings/audit">) {
  return (
    <PageBody className="max-w-4xl">
      <PageHeader
        back={{ href: "/settings", label: "Settings" }}
        title="AI audit log"
        description="Every decision Cleared’s AI made and every action Cleared took in PayPal, with what was checked and who approved it."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Audit searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-48" />}>
        <Webhooks />
      </Suspense>
    </PageBody>
  );
}

async function Webhooks() {
  return <WebhookHealth now={await requestNow()} />;
}

async function Audit({ searchParams }: { searchParams: PageProps<"/settings/audit">["searchParams"] }) {
  const now = await requestNow();
  const seller = await requireSeller();
  const subject = (await searchParams).subject;
  const rows = await db
    .select()
    .from(s.audit)
    .where(typeof subject === "string" ? and(eq(s.audit.sellerId, seller.id), eq(s.audit.subjectId, subject)) : eq(s.audit.sellerId, seller.id))
    .orderBy(desc(s.audit.createdAt))
    .limit(60);
  if (!rows.length) return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Nothing yet. Check a sale or open a case, and each AI step appears here.</CardContent></Card>;

  return (
    <ol className="space-y-3">
      {typeof subject === "string" ? <p className="text-sm text-muted-foreground">Showing one item. <Link href="/settings/audit" className="underline">Show everything</Link></p> : null}
      {rows.map((row) => {
        const k = KIND[row.kind] ?? { label: row.kind, ai: row.kind.startsWith("ai.") };
        const out = (row.output ?? {}) as Output;
        const checker = row.checker as { kept?: number; removed?: { text: string; reasons: string[] }[]; accepted?: boolean } | null;
        const u = out.usage;
        const cost = costOf(u, row.model ?? undefined);
        return (
          <li key={row.id}>
            <Card className="gap-3 px-5 py-4">
              <div className="flex flex-wrap items-start gap-3">
                {k.ai ? <AgentMark className="size-6 shrink-0" /> : <SendIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{k.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {relativeTime(row.createdAt, now)}
                    {row.model ? ` · ${row.model}${row.effort ? ` (${row.effort} effort)` : ""}` : ""}{out.promptVersion ? ` · prompt ${out.promptVersion}` : ""}
                    {out.ms ? ` · ${(out.ms / 1000).toFixed(1)} s` : ""}
                    {u ? ` · ${(u.input ?? 0).toLocaleString()} tokens in, ${(u.output ?? 0).toLocaleString()} out` : ""}
                    {cost !== null ? ` · ≈ $${cost.toFixed(4)}` : ""}
                  </p>
                </div>
                {row.approvedBy ? <Badge variant="outline" className="gap-1"><UserCheckIcon aria-hidden className="size-3" /> Approved by you</Badge> : k.ai ? <Badge variant="secondary">Draft only</Badge> : null}
              </div>

              {row.kind === "ai.packet.draft" ? (
                <div className="space-y-2 text-sm">
                  <p>Recommended <span className="font-medium">{out.recommendation}</span> with {out.claims?.length ?? 0} claims.</p>
                  {checker ? (
                    <p className={cn("flex items-center gap-1.5", checker.removed?.length ? "text-risk" : "text-cleared")}>
                      {checker.removed?.length ? <CircleSlashIcon aria-hidden className="size-4" /> : <CheckCircle2Icon aria-hidden className="size-4" />}
                      Claim checker: {checker.kept ?? 0} kept{checker.removed?.length ? `, ${checker.removed.length} struck` : ", none struck"}
                    </p>
                  ) : null}
                  {checker?.removed?.map((r) => <p key={r.text} className="pl-6 text-muted-foreground"><span className="line-through">{r.text}</span> · {r.reasons.join("; ")}</p>)}
                </div>
              ) : null}
              {row.kind === "ai.preflight" ? <p className="text-sm text-muted-foreground">{out.findings?.length ? `Suggested: ${out.findings.map((f) => f.title).join(" · ")}` : "Found nothing the rule checks hadn’t already covered."}</p> : null}
              {row.kind === "ai.notice.reply" ? <p className={cn("text-sm", checker?.accepted ? "text-cleared" : "text-risk")}>{checker?.accepted ? "Accepted: it used only facts Cleared holds." : `Rejected and replaced with the plain draft: it introduced ${out.introduced?.join(", ")}.`}</p> : null}
              {row.kind === "paypal.dispute.provide_evidence" ? <p className="text-sm text-muted-foreground">Sent {out.files?.join(", ")}. PayPal status afterwards: {out.paypalStatus?.toLowerCase().replaceAll("_", " ")}.</p> : null}
              {row.kind === "paypal.invoice.send" && out.number ? <p className="text-sm text-muted-foreground">Invoice #{out.number}</p> : null}
              {row.inputHash ? <p className="font-mono text-[0.7rem] text-muted-foreground">input fingerprint {row.inputHash}</p> : null}
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
