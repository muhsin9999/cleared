import { desc, gte, sql } from "drizzle-orm";
import { CheckCircle2Icon, CircleAlertIcon, RadioTowerIcon } from "lucide-react";
import { db, schema as s } from "@/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function WebhookHealth({ now }: { now: number }) {
  const since = new Date(now - 7 * 86_400_000);
  const [recent, [totals]] = await Promise.all([
    db.select().from(s.webhookDeliveries).orderBy(desc(s.webhookDeliveries.receivedAt)).limit(6),
    db
      .select({ total: sql<number>`count(*)::int`, verified: sql<number>`count(*) filter (where ${s.webhookDeliveries.verification} = 'SUCCESS')::int` })
      .from(s.webhookDeliveries)
      .where(gte(s.webhookDeliveries.receivedAt, since)),
  ]);
  const rejected = totals.total - totals.verified;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><RadioTowerIcon aria-hidden className="size-4" /> Webhook health</CardTitle>
        <CardDescription>
          {recent[0] ? `Last event ${relativeTime(recent[0].receivedAt, now)}. ` : "No events received yet. "}
          {totals.total} in the last 7 days: {totals.verified} verified by PayPal{rejected ? `, ${rejected} rejected` : ""}.
        </CardDescription>
      </CardHeader>
      {recent.length ? (
        <CardContent>
          <ul className="divide-y text-sm">
            {recent.map((d) => {
              const ok = d.verification === "SUCCESS";
              return (
                <li key={d.id} className="flex items-center gap-3 py-2">
                  {ok ? <CheckCircle2Icon aria-hidden className="size-4 shrink-0 text-cleared" /> : <CircleAlertIcon aria-hidden className="size-4 shrink-0 text-risk" />}
                  <code className="min-w-0 flex-1 truncate font-mono text-xs">{d.type ?? "unknown"}</code>
                  <span className={cn("text-xs", ok ? "text-muted-foreground" : "text-risk")}>{ok ? d.outcome : `${d.verification.toLowerCase()} · ${d.error ?? ""}`}</span>
                  <time className="w-20 text-right text-xs text-muted-foreground" dateTime={d.receivedAt.toISOString()}>{relativeTime(d.receivedAt, now)}</time>
                </li>
              );
            })}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  );
}
