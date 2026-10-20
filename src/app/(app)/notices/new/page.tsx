import { MailWarningIcon, ShieldAlertIcon } from "lucide-react";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

export const metadata = { title: "Read a PayPal email" };

export default function NewNoticePage() {
  return (
    <PageBody className="max-w-3xl">
      <PageHeader title="I got a PayPal email" description="Paste a limitation or hold email, or upload a screenshot. Cleared checks it for phishing first, then maps what PayPal is asking for to the proof you already have." />
      <Card>
        <CardContent className="space-y-5 pt-6">
          <Field>
            <FieldLabel htmlFor="notice">Email text</FieldLabel>
            <Textarea id="notice" rows={8} placeholder="Paste the full email, including the sender address" />
            <FieldDescription>Screenshots and PDFs arrive with the notice reader build (day 9).</FieldDescription>
          </Field>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Do you see this same message in your PayPal Resolution Center?</legend>
            <div className="flex flex-wrap gap-2">{["Yes", "No", "Not sure"].map((o) => <Button key={o} type="button" variant="outline" size="sm">{o}</Button>)}</div>
          </fieldset>
          <div className="flex items-start gap-3 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            <ShieldAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            Real PayPal limitation notices always appear in your Resolution Center too. If this one doesn’t, forward it to phishing@paypal.com and don’t click its links.
          </div>
          <Button size="lg" disabled><MailWarningIcon aria-hidden /> Check this email</Button>
        </CardContent>
      </Card>
    </PageBody>
  );
}
