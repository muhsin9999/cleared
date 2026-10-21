import Link from "next/link";
import { Suspense } from "react";
import { BotIcon, InfoIcon, PlugZapIcon, RotateCcwIcon } from "lucide-react";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { resetDemo } from "@/server/actions/demo";
import { requireSeller } from "@/server/auth";

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
  const seller = await requireSeller();
  const rows = [
    { icon: PlugZapIcon, title: "PayPal connection", body: "Sandbox business account · Invoicing, Orders, Tracking and Disputes enabled", badge: "Sandbox" },
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
      <Link href="/settings/audit" className="block rounded-[10px] focus-visible:outline-2 focus-visible:outline-focus">
        <Card className="flex-row items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/40">
          <BotIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-cleared" />
          <div className="min-w-0 flex-1"><p className="font-medium">AI audit log and PayPal webhooks</p><p className="text-sm text-muted-foreground">Every AI decision, the model that made it, what the claim checker removed and who approved it, plus every event PayPal sent.</p></div>
          <span className="text-sm text-muted-foreground">Open →</span>
        </Card>
      </Link>
      {seller.isDemo ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RotateCcwIcon aria-hidden className="size-4" /> Start over</CardTitle>
            <CardDescription>Put your copy of Ada’s workspace back the way you found it. Each visitor gets a private copy, so nothing you do here affects anyone else.</CardDescription>
          </CardHeader>
          <CardContent><form action={resetDemo}><Button type="submit" variant="outline">Start over</Button></form></CardContent>
        </Card>
      ) : null}
      <Card className="flex-row items-start gap-4 px-5 py-4">
        <InfoIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cleared is not affiliated with or endorsed by PayPal. It uses the public PayPal sandbox APIs; no real money moves.</p>
      </Card>
    </div>
  );
}
