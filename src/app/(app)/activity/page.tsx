import { Suspense } from "react";
import { ActivityFeed } from "@/components/app/activity-feed";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requireSeller } from "@/server/auth";
import { requestNow } from "@/server/time";
import { listEvents } from "@/server/queries";

export const metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <PageBody className="max-w-3xl">
      <PageHeader title="Activity" description="What PayPal sent, and what Cleared did." />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Activity />
      </Suspense>
    </PageBody>
  );
}

async function Activity() {
  const now = await requestNow();
  const seller = await requireSeller();
  const events = await listEvents(seller.id, 200);
  return <ActivityFeed events={events} now={now} />;
}
