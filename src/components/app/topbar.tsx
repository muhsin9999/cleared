import Link from "next/link";
import { Suspense } from "react";
import { HourglassIcon, LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { daysUntil, money } from "@/lib/format";
import { signOut } from "@/server/actions/session";
import { requireSeller } from "@/server/auth";
import { disputeStock, getHome, latestPayableInvoice } from "@/server/queries";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { AskCleared } from "./ask-cleared";
import { DemoPanel } from "./demo-panel";

async function HoldIsland() {
  const seller = await requireSeller();
  const home = await getHome(seller.id);
  const days = daysUntil(home.nextRelease);
  if (!home.nextReleaseSale || days === null) return null;
  return (
    <Link href={`/sales/${home.nextReleaseSale.id}`} title={`${home.nextReleaseSale.clientName}: PayPal releases it ${days === 0 ? "today" : `in ${days} ${days === 1 ? "day" : "days"}`}`} className="flex min-w-0 items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-sm whitespace-nowrap text-paper shadow-soft transition-opacity hover:opacity-90">
      <HourglassIcon aria-hidden className="size-3.5 shrink-0 text-cleared-tint" />
      <span>
        <span className="font-medium tabular-nums">{money(home.nextReleaseSale.amountCents)}</span>
        <span className="hidden sm:inline"> releases</span> in{" "}
        <span className="font-medium tabular-nums">{days} {days === 1 ? "day" : "days"}</span>
      </span>
    </Link>
  );
}

async function Account() {
  const seller = await requireSeller();
  const [payable, stock] = seller.isDemo ? await Promise.all([latestPayableInvoice(seller.id), disputeStock()]) : [null, 0];
  const initials = seller.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
  return (
    <div className="ml-auto flex items-center gap-2">
      {seller.isDemo ? <DemoPanel stock={stock} buyerEmail={process.env.PAYPAL_SANDBOX_BUYER_EMAIL ?? null} payable={payable && payable.url ? { url: payable.url, label: `Invoice #${payable.number} · ${money(payable.amountCents)} · ${payable.clientName}` } : null} /> : null}
      <Avatar className="size-8"><AvatarFallback className="bg-cleared-tint text-xs font-medium text-cleared-strong">{initials}</AvatarFallback></Avatar>
      <span className="hidden text-sm lg:inline">{seller.name}</span>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="icon" aria-label="Sign out"><LogOutIcon aria-hidden /></Button>
      </form>
    </div>
  );
}

async function AskIsland() {
  const seller = await requireSeller();
  const [recent, memos] = await Promise.all([
    db.select().from(schema.assistantMessages).where(eq(schema.assistantMessages.sellerId, seller.id)).orderBy(desc(schema.assistantMessages.createdAt)).limit(300),
    db.select({ id: schema.memos.id, text: schema.memos.text, sale: schema.sales.clientName }).from(schema.memos).leftJoin(schema.sales, eq(schema.sales.id, schema.memos.saleId)).where(eq(schema.memos.sellerId, seller.id)).orderBy(desc(schema.memos.createdAt)),
  ]);
  return (
    <AskCleared
      messages={recent.reverse().map((m) => ({ id: m.id, thread: m.thread, at: m.createdAt.toISOString(), kind: m.kind, body: m.body as Record<string, never> }))}
      memos={memos.map((m) => ({ id: m.id, text: m.text, about: m.sale }))}
    />
  );
}

export function Topbar() {
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-paper/85 px-4 backdrop-blur sm:px-8">
      <Suspense fallback={<Skeleton className="h-8 w-56 rounded-full" />}>
        <HoldIsland />
      </Suspense>
      <div className="ml-auto flex items-center gap-2">
        <Suspense fallback={<Skeleton className="h-8 w-28 rounded-full" />}>
          <AskIsland />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-8 w-40" />}>
          <Account />
        </Suspense>
      </div>
    </div>
  );
}
