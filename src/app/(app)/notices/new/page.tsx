import { Suspense } from "react";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { NoticeForm } from "./notice-form";

export const metadata = { title: "Read a PayPal email" };

export default function NewNoticePage({ searchParams }: PageProps<"/notices/new">) {
  return (
    <PageBody className="max-w-3xl">
      <PageHeader
        back={{ href: "/cases", label: "All cases" }}
        title="I got a PayPal email"
        description="Check it’s really PayPal before you click anything."
      />
      <Suspense fallback={<NoticeForm />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </PageBody>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/notices/new">["searchParams"] }) {
  const { sample } = await searchParams;
  return <NoticeForm sample={sample === "phishing" || sample === "genuine" ? sample : undefined} />;
}
