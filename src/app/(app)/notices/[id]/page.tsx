import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { and, eq } from "drizzle-orm";
import { CalendarClockIcon, CheckCircle2Icon, CircleAlertIcon, CircleHelpIcon, CircleXIcon, ShieldAlertIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import { CopyButton } from "@/components/app/copy-button";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db, schema as s } from "@/db";
import { shortDate } from "@/lib/format";
import type { NoticeResult } from "@/lib/notice";
import { cn } from "@/lib/utils";
import { markNoticeDone } from "@/server/actions/notices";
import { requireSeller } from "@/server/auth";

export const metadata = { title: "PayPal email" };

const TYPE_LABEL = { limitation: "Account limitation", hold: "Payment hold", reserve: "Reserve on your balance", closure: "Account closure", documents: "Request for documents", unknown: "PayPal notice" } as const;

export default function NoticePage({ params }: PageProps<"/notices/[id]">) {
  return (
    <PageBody className="max-w-4xl">
      <Suspense fallback={<Skeleton className="h-[30rem]" />}>
        <Notice params={params} />
      </Suspense>
    </PageBody>
  );
}

async function Notice({ params }: { params: PageProps<"/notices/[id]">["params"] }) {
  const { id } = await params;
  const seller = await requireSeller();
  const notice = await db.query.notices.findFirst({ where: and(eq(s.notices.id, id), eq(s.notices.sellerId, seller.id)) });
  if (!notice) notFound();
  const r = notice.result as unknown as NoticeResult;
  const phishing = r.verdict === "likely_phishing";
  const strong = r.signals.filter((x) => x.strength === "strong");
  const weak = r.signals.filter((x) => x.strength === "weak");
  const byDate = r.deadline ? new Date(r.deadline.byDate) : null;

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/cases" className="hover:text-foreground">Cases</Link>}
        title={phishing ? "This email is likely phishing" : TYPE_LABEL[r.type]}
        description={`Checked ${shortDate(notice.createdAt)}${r.transcribed ? " · read from your screenshot by Cleared AI" : ""}${notice.doneAt ? " · marked as done" : ""}`}
      />

      <Card className={cn("gap-4 border-l-4 px-6 py-5", phishing ? "border-l-risk bg-risk-tint/50" : r.verdict === "genuine" ? "border-l-cleared bg-cleared-tint/40" : "border-l-caution bg-caution-tint/60")}>
        <div className="flex items-start gap-3" role="status">
          {phishing ? <ShieldAlertIcon aria-hidden className="mt-0.5 size-6 shrink-0 text-risk" /> : r.verdict === "genuine" ? <ShieldCheckIcon aria-hidden className="mt-0.5 size-6 shrink-0 text-cleared" /> : <CircleHelpIcon aria-hidden className="mt-0.5 size-6 shrink-0 text-caution" />}
          <div className="space-y-1">
            <p className="text-lg font-semibold">
              {phishing ? "Don’t click anything in it, and don’t reply." : r.verdict === "genuine" ? "This looks like a real PayPal notice." : "Cleared can’t confirm this came from PayPal."}
            </p>
            <p className="text-sm text-muted-foreground">
              {phishing
                ? "Forward the original email to phishing@paypal.com, then delete it. If you clicked a link or entered details, change your PayPal password from paypal.com directly."
                : r.verdict === "genuine"
                  ? "It matches a message in your Resolution Center. Below is what PayPal asked for, and what you already have."
                  : "Log in at paypal.com yourself and look for the same message in the Resolution Center before you send anything."}
            </p>
          </div>
        </div>
        {r.signals.length ? (
          <ul className="space-y-1.5 border-t pt-3 text-sm">
            {[...strong, ...weak, ...r.signals.filter((x) => x.strength === "reassuring")].map((x) => (
              <li key={x.id} className="flex items-start gap-2">
                {x.strength === "reassuring" ? <CheckCircle2Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-cleared" /> : <CircleAlertIcon aria-hidden className={cn("mt-0.5 size-4 shrink-0", x.strength === "strong" ? "text-risk" : "text-caution")} />}
                <span>{x.text}{x.strength === "strong" ? <span className="sr-only"> (strong sign)</span> : null}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {phishing ? (
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-surface px-2 py-1 font-mono text-sm">phishing@paypal.com</code>
            <CopyButton value="phishing@paypal.com" label="Copy address" toastMessage="Address copied" />
          </div>
        ) : null}
      </Card>

      {!phishing ? (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            {r.deadline && byDate ? (
              <Card className="flex-row items-center gap-3 border-caution/30 bg-caution-tint px-5 py-3">
                <CalendarClockIcon aria-hidden className="size-5 text-caution" />
                <p className="text-sm">PayPal asks for this <span className="font-semibold">within {r.deadline.days} days</span> (by {shortDate(byDate)}).</p>
              </Card>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle>What PayPal is asking for</CardTitle>
                <CardDescription>Matched against the proof Cleared keeps for your sales.</CardDescription>
              </CardHeader>
              <CardContent>
                {r.requirements.length ? (
                  <ul className="divide-y">
                    {r.requirements.map((q) => (
                      <li key={q.key} className="flex items-start gap-3 py-3">
                        {q.status === "ready" ? <CheckCircle2Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-cleared" /> : q.status === "missing" ? <CircleXIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-risk" /> : <UserIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{q.label}</p>
                          <p className="text-sm text-muted-foreground">{q.status === "ready" ? `You have it: ${q.help}` : q.status === "missing" ? `Missing. ${q.help}` : q.help}</p>
                        </div>
                        <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", q.status === "ready" ? "bg-cleared-tint text-cleared-strong" : q.status === "missing" ? "bg-risk-tint text-risk" : "bg-muted text-muted-foreground")}>
                          {q.status === "ready" ? "Ready" : q.status === "missing" ? "Missing" : "From you"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Cleared didn’t find a specific request in this email. Check the Resolution Center for the exact list.</p>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4 lg:col-span-2">
            {r.draftReply ? (
              <Card>
                <CardHeader>
                  <CardTitle>Draft reply</CardTitle>
                  <CardDescription>{r.replySource === "ai" ? "Written by Cleared AI using only your records · check before sending" : "Drafted by Cleared from your records · check before sending"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <pre className="max-h-80 overflow-auto rounded-md bg-paper px-3 py-2 font-sans text-sm whitespace-pre-wrap">{r.draftReply}</pre>
                  <CopyButton value={r.draftReply} label="Copy reply" toastMessage="Reply copied" />
                </CardContent>
              </Card>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle>Send it yourself, in PayPal</CardTitle>
                <CardDescription>PayPal has no public API for limitation notices, so this last step is yours.</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-inside list-decimal space-y-1.5 text-sm">
                  <li>Open paypal.com in a new tab (type it; don’t use the email’s links).</li>
                  <li>Go to the Resolution Center and open this notice.</li>
                  <li>Paste the reply and upload the items marked Ready and From you.</li>
                  <li>PayPal usually answers within about three business days.</li>
                </ol>
                {notice.doneAt ? (
                  <p className="mt-4 flex items-center gap-2 text-sm text-cleared"><CheckCircle2Icon aria-hidden className="size-4" /> Marked as done</p>
                ) : (
                  <form action={markNoticeDone.bind(null, notice.id)} className="mt-4">
                    <Button type="submit" variant="outline" size="sm">I’ve sent it in PayPal</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
