import { Suspense } from "react";
import { EventList } from "@/components/app/event-row";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireSeller } from "@/server/auth";
import { requestNow } from "@/server/time";
import { listEvents } from "@/server/queries";

export const metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <PageBody className="max-w-3xl">
      <PageHeader title="Activity" description="Every event from PayPal, checked against PayPal’s signature before it appears here, plus what Cleared did." />
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
  return <Card><CardContent className="pt-6">{events.length ? <EventList events={events} now={now} /> : <p className="py-8 text-center text-sm text-muted-foreground">Nothing yet. Events appear here the moment PayPal sends them.</p>}</CardContent></Card>;
}
