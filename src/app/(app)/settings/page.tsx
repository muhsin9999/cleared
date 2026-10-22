import Link from "next/link";
import { Suspense } from "react";
import { InfoIcon, PlugZapIcon } from "lucide-react";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { AgentMark } from "@/components/brand/marks";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
          <AgentMark className="size-6 shrink-0" />
          <div className="min-w-0 flex-1"><p className="font-medium">AI audit log and PayPal webhooks</p><p className="text-sm text-muted-foreground">Every AI step, what it cost and who approved it. Plus every event PayPal sent.</p></div>
          <span className="text-sm text-muted-foreground">Open →</span>
        </Card>
      </Link>
      <Card className="flex-row items-start gap-4 px-5 py-4">
        <InfoIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cleared is not affiliated with or endorsed by PayPal. It uses the public PayPal sandbox APIs; no real money moves.</p>
      </Card>
    </div>
  );
}
