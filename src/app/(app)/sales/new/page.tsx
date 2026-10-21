import { Suspense } from "react";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { sellerHistory } from "@/server/actions/sales";
import { NewSaleFlow } from "./new-sale-flow";

export const metadata = { title: "New sale" };

export default function NewSalePage({ searchParams }: PageProps<"/sales/new">) {
  return (
    <PageBody className="max-w-4xl">
      <PageHeader title="New sale" description="Describe the job. Before anything is sent, Cleared checks it against your history and PayPal’s published rules, and the AI reads it the way a PayPal reviewer would." />
      <Suspense fallback={<Skeleton className="h-[28rem]" />}>
        <Flow searchParams={searchParams} />
      </Suspense>
    </PageBody>
  );
}

async function Flow({ searchParams }: { searchParams: PageProps<"/sales/new">["searchParams"] }) {
  const [history, { sample }] = await Promise.all([sellerHistory(), searchParams]);
  return <NewSaleFlow history={history} sample={sample === "1"} />;
}
