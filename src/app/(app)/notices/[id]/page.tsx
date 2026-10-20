import Link from "next/link";
import { PageBody, PageHeader } from "@/components/app/page-header";

export const metadata = { title: "Notice" };

export default function NoticePage() {
  return (
    <PageBody className="max-w-3xl">
      <PageHeader eyebrow={<Link href="/cases" className="hover:text-foreground">Cases</Link>} title="Notice" description="The phishing verdict, what PayPal is asking for, and a draft reply appear here (day 9)." />
    </PageBody>
  );
}
