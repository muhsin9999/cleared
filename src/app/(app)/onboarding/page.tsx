import Link from "next/link";
import { CheckCircle2Icon } from "lucide-react";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Get started" };

export default function OnboardingPage() {
  return (
    <PageBody className="max-w-2xl">
      <PageHeader eyebrow="Step 1 of 3" title="Connect PayPal" description="Cleared works against one PayPal sandbox business account in this demo." />
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2Icon aria-hidden className="size-5 text-cleared" /> Sandbox business account connected</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>In a real launch you would connect your own account with Log in with PayPal. That needs PayPal partner onboarding, so it is switched off here.</p>
          <Link href="/home" className={buttonVariants()}>Continue</Link>
        </CardContent>
      </Card>
    </PageBody>
  );
}
