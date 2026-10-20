import { Suspense } from "react";
import { BotIcon, InfoIcon, PlugZapIcon, RotateCcwIcon } from "lucide-react";
import { WebhookHealth } from "@/components/app/webhook-health";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { resetDemo } from "@/server/actions/demo";
import { requireSeller } from "@/server/auth";
import { requestNow } from "@/server/time";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PageBody className="max-w-3xl">
      <PageHeader title="Settings" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Settings />
      </Suspense>
    </PageBody>
  );
}

async function Settings() {
  const now = await requestNow();
  const seller = await requireSeller();
  const rows = [
    { icon: PlugZapIcon, title: "PayPal connection", body: "Sandbox business account · Invoicing, Orders, Tracking and Disputes enabled", badge: "Sandbox" },
    { icon: BotIcon, title: "AI audit log", body: "Every AI draft, the model that wrote it, the claim checker’s result and who approved it.", badge: "From day 7" },
  ];
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <Card key={r.title} className="flex-row items-start gap-4 px-5 py-4">
          <r.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1"><p className="font-medium">{r.title}</p><p className="text-sm text-muted-foreground">{r.body}</p></div>
          <Badge variant="outline">{r.badge}</Badge>
        </Card>
      ))}
      <WebhookHealth now={now} />
      {seller.isDemo ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RotateCcwIcon aria-hidden className="size-4" /> Demo data</CardTitle>
            <CardDescription>Put Ada’s workspace back to how a judge first sees it. This also runs every night.</CardDescription>
          </CardHeader>
          <CardContent><form action={resetDemo}><Button type="submit" variant="outline">Reset demo data</Button></form></CardContent>
        </Card>
      ) : null}
      <Card className="flex-row items-start gap-4 px-5 py-4">
        <InfoIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cleared is not affiliated with or endorsed by PayPal. It uses the public PayPal sandbox APIs; no real money moves.</p>
      </Card>
    </div>
  );
}
