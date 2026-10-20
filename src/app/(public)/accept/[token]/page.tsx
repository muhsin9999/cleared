import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { FileImage, FileText, Link2Off } from "lucide-react";
import { Logo, StampMark } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { db, schema } from "@/db";
import { money, shortDate } from "@/lib/format";
import { AcceptanceForm } from "./acceptance-form";
import { ConfirmationRecord, type AcceptanceRecord } from "./record";

export const metadata: Metadata = {
  title: "Confirm delivery",
  robots: { index: false, follow: false },
};

export default function AcceptPage({ params }: PageProps<"/accept/[token]">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-14 w-full max-w-lg items-center justify-between px-4">
        <Logo className="[&_span]:text-base" />
        <span className="text-xs text-muted-foreground">Delivery confirmation</span>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-4 pb-16">
        <Suspense fallback={<AcceptSkeleton />}>
          <Acceptance params={params} />
        </Suspense>
      </main>
      <footer className="mx-auto w-full max-w-lg px-4 pb-8 text-center text-xs leading-relaxed text-muted-foreground">
        Cleared keeps delivery records for independent sellers. Works with PayPal (sandbox). Not affiliated with or endorsed by PayPal.
      </footer>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function fileSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

async function Acceptance({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // The order is read fresh on every request (the client may have just confirmed it).
  await connection();
  const sale = await db.query.sales.findFirst({
    where: eq(schema.sales.acceptanceToken, token),
    with: { seller: true, invoices: true, proofs: true },
  });
  if (!sale) return <LinkNotFound />;

  const sellerName = sale.seller.name;
  const files = sale.proofs.filter((p) => p.kind === "file").sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const acceptance = sale.proofs.find((p) => p.kind === "acceptance");
  const invoiceNumber = sale.invoices.find((i) => i.invoiceNumber)?.invoiceNumber;
  const deliveredAt = sale.deliveredAt ?? files.at(-1)?.occurredAt ?? null;
  const meta = (acceptance?.meta ?? {}) as Partial<AcceptanceRecord>;

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full border border-line bg-surface text-sm font-semibold text-ink" aria-hidden>
            {initials(sellerName)}
          </span>
          <p className="text-sm text-muted-foreground">
            {sale.seller.businessName ?? sellerName}
            {deliveredAt ? <> · delivered {shortDate(deliveredAt)}</> : null}
          </p>
        </div>
        <h1 className="mt-5 text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] text-balance text-ink">
          {sellerName} marked your order as delivered
        </h1>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
          {acceptance ? "You've already confirmed this delivery. Here is the record." : `Please check the files, then let ${sellerName.split(" ")[0]} know whether everything arrived.`}
        </p>
      </div>

      <section aria-label="Order summary" className="overflow-hidden rounded-[10px] border border-line bg-surface shadow-soft">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="min-w-0">
            <p className="font-mono text-[0.68rem] tracking-[0.08em] text-muted-foreground uppercase">
              {invoiceNumber ? <>Invoice #{invoiceNumber}</> : "Order"} · {sale.clientName}
            </p>
            <h2 className="mt-1.5 text-[1.05rem] font-semibold tracking-[-0.015em] text-ink">{sale.title}</h2>
          </div>
          <p className="shrink-0 text-lg font-semibold tracking-[-0.02em] text-ink tabular-nums">{money(sale.amountCents, sale.currency)}</p>
        </div>
        <p className="px-5 pt-2 pb-5 text-sm leading-relaxed text-muted-foreground">{sale.description}</p>
        <div className="border-t border-line bg-paper/50 px-5 py-4">
          <h3 className="text-xs font-medium tracking-[0.02em] text-muted-foreground">
            {files.length === 0 ? "No files attached" : `${files.length} ${files.length === 1 ? "file" : "files"} delivered`}
          </h3>
          {files.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {files.map((f) => {
                const Icon = f.mimeType?.startsWith("image/") ? FileImage : FileText;
                return (
                  <li key={f.id} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5">
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{f.label}</p>
                      <p className="truncate font-mono text-[0.7rem] text-muted-foreground">{f.fileName}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[0.7rem] text-muted-foreground tabular-nums">{fileSize(f.sizeBytes)}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </section>

      {acceptance ? (
        <ConfirmationRecord
          sellerName={sellerName}
          record={{ at: acceptance.occurredAt.toISOString(), name: meta.name, ip: meta.ip ?? "unknown", userAgent: meta.userAgent ?? "unknown" }}
        />
      ) : (
        <AcceptanceForm token={token} sellerName={sellerName} />
      )}
    </div>
  );
}

function LinkNotFound() {
  return (
    <div className="mt-6 rounded-[10px] border border-line bg-surface px-6 py-10 text-center shadow-soft">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Link2Off className="size-5" aria-hidden />
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-ink">This link isn&apos;t active</h1>
      <p className="mx-auto mt-2 max-w-xs text-[0.95rem] leading-relaxed text-muted-foreground">
        It may have been mistyped or replaced by a newer one. Ask the seller to send you the confirmation link again.
      </p>
      <StampMark className="mx-auto mt-8 size-6 text-line" />
    </div>
  );
}

function AcceptSkeleton() {
  return (
    <div className="space-y-6 pt-2" aria-busy="true" aria-label="Loading the order">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-8 w-4/5" />
      <Skeleton className="h-56 w-full rounded-[10px]" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
