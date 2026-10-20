import Link from "next/link";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { NoticeForm } from "./notice-form";

export const metadata = { title: "Read a PayPal email" };

export default function NewNoticePage() {
  return (
    <PageBody className="max-w-3xl">
      <PageHeader
        eyebrow={<Link href="/cases" className="hover:text-foreground">Cases</Link>}
        title="I got a PayPal email"
        description="Cleared checks it for phishing first. If it’s real, it lists what PayPal is asking for, shows which proof you already have, and drafts your reply."
      />
      <NoticeForm />
    </PageBody>
  );
}
