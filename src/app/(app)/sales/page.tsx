import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";
import { CoverageDots } from "@/components/app/coverage-dots";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { SaleStatusBadge } from "@/components/brand/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { money, shortDate } from "@/lib/format";
import { requireSeller } from "@/server/auth";
import { coverage, listSales } from "@/server/queries";

export const metadata = { title: "Sales" };

export default function SalesPage() {
  return (
    <PageBody>
      <PageHeader title="Sales" description="Every sale, its PayPal status, and how well its proof is covered." actions={<Link href="/sales/new" className={buttonVariants({ size: "lg" })}><PlusIcon aria-hidden /> New sale</Link>} />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <SalesTable />
      </Suspense>
    </PageBody>
  );
}

async function SalesTable() {
  const seller = await requireSeller();
  const sales = await listSales(seller.id);
  if (!sales.length)
    return (
      <Empty className="border bg-surface">
        <EmptyHeader>
          <EmptyTitle>No sales yet</EmptyTitle>
          <EmptyDescription>Describe your first sale and Cleared will check it against PayPal’s published rules before you invoice.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent><Link href="/sales/new" className={buttonVariants()}>Check your first sale</Link></EmptyContent>
      </Empty>
    );
  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Sale</TableHead>
            <TableHead className="hidden sm:table-cell">Client</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Proof</TableHead>
            <TableHead className="hidden pr-5 md:table-cell">Release</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((s) => {
            const c = coverage(s);
            return (
              <TableRow key={s.id} className="relative cursor-pointer">
                <TableCell className="max-w-56 pl-5">
                  <Link href={`/sales/${s.id}`} className="block truncate font-medium after:absolute after:inset-0">{s.title}</Link>
                  <span className="text-xs text-muted-foreground">{shortDate(s.createdAt)}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{s.clientName}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{money(s.amountCents)}</TableCell>
                <TableCell><SaleStatusBadge status={s.status} /></TableCell>
                <TableCell className="hidden md:table-cell">{s.paidAt ? <CoverageDots {...c} /> : <span className="text-xs text-muted-foreground">After payment</span>}</TableCell>
                <TableCell className="hidden pr-5 text-muted-foreground md:table-cell">{s.releasedAt ? `Released ${shortDate(s.releasedAt)}` : s.expectedReleaseAt ? shortDate(s.expectedReleaseAt) : "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
