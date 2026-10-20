import Link from "next/link";
import { Suspense } from "react";
import { MailWarningIcon, ShieldAlertIcon } from "lucide-react";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { daysUntil, money, shortDate } from "@/lib/format";
import { requireSeller } from "@/server/auth";
import { requestNow } from "@/server/time";
import { getHome, listDisputes, listNotices } from "@/server/queries";
import { DISPUTE_LABEL, REASON_LABEL } from "@/lib/labels";

export const metadata = { title: "Cases" };

export default function CasesPage() {
  return (
    <PageBody>
      <PageHeader title="Cases" description="Disputes from PayPal and PayPal emails you’ve asked Cleared to read." actions={<Link href="/notices/new" className={buttonVariants({ variant: "outline" })}><MailWarningIcon aria-hidden /> I got a PayPal email</Link>} />
      <Suspense fallback={<Skeleton className="h-72" />}>
        <Cases />
      </Suspense>
    </PageBody>
  );
}

async function Cases() {
  const now = await requestNow();
  const seller = await requireSeller();
  const [disputes, notices, home] = await Promise.all([listDisputes(seller.id), listNotices(seller.id), getHome(seller.id)]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlertIcon aria-hidden className="size-4" /> Disputes</CardTitle></CardHeader>
        <CardContent>
          {disputes.length ? (
            <ul className="divide-y">
              {disputes.map((d) => {
                const due = daysUntil(d.responseDueAt, now);
                return (
                  <li key={d.id}>
                    <Link href={`/cases/${d.id}`} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 hover:bg-muted/60">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{d.sale?.title ?? d.paypalDisputeId}</p>
                        <p className="truncate text-sm text-muted-foreground">{REASON_LABEL[d.reason] ?? d.reason} · {shortDate(d.openedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium tabular-nums">{money(d.amountCents)}</p>
                        <Badge variant={d.status.startsWith("resolved") ? "outline" : "secondary"}>{DISPUTE_LABEL[d.status]}{d.status === "waiting_for_seller" && due !== null ? ` · ${due}d left` : ""}</Badge>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No open disputes.{home.proofCoverage !== null ? ` Your proof coverage is ${home.proofCoverage}%.` : ""}</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MailWarningIcon aria-hidden className="size-4" /> PayPal notices</CardTitle></CardHeader>
        <CardContent>
          {notices.length ? (
            <ul className="divide-y">
              {notices.map((n) => (
                <li key={n.id}>
                  <Link href={`/notices/${n.id}`} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 hover:bg-muted/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{n.verdict === "likely_phishing" ? "Likely phishing" : n.verdict === "genuine" ? "PayPal notice" : "Unconfirmed notice"}</p>
                      <p className="truncate text-sm text-muted-foreground">{shortDate(n.createdAt)}{n.doneAt ? " · done" : ""}</p>
                    </div>
                    <Badge variant={n.verdict === "likely_phishing" ? "destructive" : n.doneAt ? "outline" : "secondary"}>{n.verdict === "likely_phishing" ? "Don’t reply" : n.doneAt ? "Done" : "To answer"}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Got an email about a limitation or hold? Paste it and Cleared checks it for phishing first.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
