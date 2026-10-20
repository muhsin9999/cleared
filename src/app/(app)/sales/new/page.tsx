import { Suspense } from "react";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { sellerHistory } from "@/server/actions/sales";
import { NewSaleFlow } from "./new-sale-flow";

export const metadata = { title: "New sale" };

export default function NewSalePage() {
  return (
    <PageBody className="max-w-4xl">
      <PageHeader title="New sale" description="Describe the job. Cleared checks it against your history and PayPal’s published rules before anything is sent." />
      <Suspense fallback={<Skeleton className="h-[28rem]" />}>
        <Flow />
      </Suspense>
    </PageBody>
  );
}

async function Flow() {
  return <NewSaleFlow history={await sellerHistory()} />;
}
