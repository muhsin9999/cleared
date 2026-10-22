"use client";

import { useActionState, useState } from "react";
import { ImageUpIcon, MailWarningIcon, ShieldAlertIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { SAMPLE_NOTICES } from "@/lib/notice-samples";
import type { ResolutionCenterAnswer } from "@/lib/notice";
import { cn } from "@/lib/utils";
import { submitNotice, type NoticeFormState } from "@/server/actions/notices";

const RC: { value: ResolutionCenterAnswer; label: string }[] = [
  { value: "yes", label: "Yes, it’s there too" },
  { value: "no", label: "No, I can’t find it" },
  { value: "unsure", label: "Not sure" },
];

export function NoticeForm({ sample }: { sample?: keyof typeof SAMPLE_NOTICES }) {
  const [state, action, pending] = useActionState(submitNotice, {} as NoticeFormState);
  const [text, setText] = useState(sample ? SAMPLE_NOTICES[sample].text : "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rc, setRc] = useState<ResolutionCenterAnswer | null>(sample ? SAMPLE_NOTICES[sample].rc : null);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Try a sample:</span>
            {(Object.keys(SAMPLE_NOTICES) as (keyof typeof SAMPLE_NOTICES)[]).map((k) => (
              <Button key={k} type="button" variant="outline" size="sm" onClick={() => { setText(SAMPLE_NOTICES[k].text); setRc(SAMPLE_NOTICES[k].rc); }}>
                <SparklesIcon aria-hidden /> {SAMPLE_NOTICES[k].label}
              </Button>
            ))}
          </div>

          <Field>
            <FieldLabel htmlFor="notice-text">The email, as you received it</FieldLabel>
            <Textarea id="notice-text" name="text" rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder={"From: …\nSubject: …\n\nPaste the whole email, including the sender line and any links."} className="font-mono text-[0.85rem]" />
            <FieldDescription>Don’t click its links.</FieldDescription>
          </Field>

          <label className={cn("flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-3 text-sm has-focus-visible:outline-2 has-focus-visible:outline-focus", fileName ? "border-cleared bg-cleared-tint/40" : "bg-paper/60 hover:bg-muted/60")}>
            <ImageUpIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              {fileName ? <span className="font-medium">{fileName}</span> : <span>Or upload a screenshot or PDF of the email</span>}
              <span className="block text-xs text-muted-foreground">PNG, JPG, WebP or PDF, up to 10 MB.</span>
            </span>
            <input type="file" name="file" accept="image/png,image/jpeg,image/gif,image/webp,application/pdf" className="sr-only" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Is it in your PayPal Resolution Center too?</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {RC.map((o) => (
                <label key={o.value} className={cn("cursor-pointer rounded-md border px-3 py-1.5 text-sm has-focus-visible:outline-2 has-focus-visible:outline-focus", rc === o.value ? "border-cleared bg-cleared-tint text-cleared-strong" : "bg-surface")}>
                  <input type="radio" name="rc" value={o.value} checked={rc === o.value} onChange={() => setRc(o.value)} className="sr-only" />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex items-start gap-3 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            <ShieldAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            Real notices always are.
          </div>

          <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p role="alert" className="text-sm text-risk">{state.error ?? ""}</p>
            <Button type="submit" size="lg" disabled={pending || (!text.trim() && !fileName) || !rc}>
              <MailWarningIcon aria-hidden /> {pending ? (fileName && !text.trim() ? "Reading your screenshot…" : "Checking…") : "Check this email"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
