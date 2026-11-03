"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CircleAlert, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { acceptWork, reportProblem, type AcceptState } from "./actions";
import { ConfirmationRecord, formatStamp } from "./record";

const IDLE: AcceptState = { status: "idle" };

export function AcceptanceForm({ token, sellerName }: { token: string; sellerName: string }) {
  const firstName = sellerName.split(" ")[0] || sellerName;
  const [acceptState, acceptAction, accepting] = useActionState(acceptWork.bind(null, token), IDLE);
  const [reportState, reportAction, reporting] = useActionState(reportProblem.bind(null, token), IDLE);
  const [mode, setMode] = useState<"confirm" | "problem">("confirm");
  const resultRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const done = acceptState.status === "accepted" || reportState.status === "reported";
  useEffect(() => {
    if (done) resultRef.current?.focus();
  }, [done]);

  const error = mode === "confirm" ? (acceptState.status === "error" ? acceptState.message : null) : reportState.status === "error" ? reportState.message : null;

  return (
    <div aria-live="polite">
      {acceptState.status === "accepted" ? (
        <div ref={resultRef} tabIndex={-1} className="space-y-3 outline-none">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">Thank you.</h2>
          <p className="text-[0.95rem] leading-relaxed text-muted-foreground">
            {firstName} can see your confirmation now. Keep this page if you like; it&apos;s your copy of the record.
          </p>
          <ConfirmationRecord record={acceptState.record} sellerName={sellerName} className="mt-4" />
        </div>
      ) : reportState.status === "reported" ? (
        <div ref={resultRef} tabIndex={-1} className="rounded-[10px] border border-line bg-surface p-5 shadow-soft outline-none">
          <div className="flex items-start gap-3">
            <MessageSquareWarning className="mt-0.5 size-5 shrink-0 text-caution" aria-hidden />
            <div>
              <h2 className="font-semibold tracking-[-0.01em] text-ink">Your note is with {firstName}</h2>
              <p className="mt-1 text-[0.95rem] leading-relaxed text-muted-foreground">
                Sent {formatStamp(reportState.at)}. {firstName} sees it straight away and can reply by email. Nothing has been sent to PayPal.
              </p>
            </div>
          </div>
        </div>
      ) : mode === "confirm" ? (
        <form action={acceptAction} className="space-y-5">
          <Field>
            <FieldLabel htmlFor="accept-name">Your name (optional)</FieldLabel>
            <Input id="accept-name" name="name" autoComplete="name" maxLength={120} placeholder="e.g. Jordan Lee" className="h-11 bg-surface text-base" />
            <FieldDescription>Added to the confirmation record so {firstName} knows who confirmed.</FieldDescription>
          </Field>
          {error ? <ErrorLine message={error} /> : null}
          <div className="space-y-3">
            <Button type="submit" disabled={accepting} className="h-12 w-full text-base hover:bg-cleared-strong">
              {accepting ? <Spinner aria-hidden /> : null}
              {accepting ? "Recording your confirmation…" : "Yes, I received the work"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full bg-surface text-base"
              onClick={() => {
                setMode("problem");
                requestAnimationFrame(() => noteRef.current?.focus());
              }}
            >
              Something&apos;s wrong
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Confirming records the time, your IP address and your browser, so {firstName} has proof of delivery. It doesn&apos;t sign you
            up for anything.
          </p>
        </form>
      ) : (
        <form action={reportAction} className="space-y-5">
          <Field>
            <FieldLabel htmlFor="problem-note">What&apos;s wrong?</FieldLabel>
            <Textarea
              ref={noteRef}
              id="problem-note"
              name="note"
              required
              minLength={3}
              maxLength={1000}
              rows={4}
              placeholder="e.g. The layered file won't open, or the colours don't match what we agreed."
              className="min-h-28 bg-surface text-base"
            />
            <FieldDescription>{firstName} sees this right away, before anything goes to PayPal.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="problem-name">Your name (optional)</FieldLabel>
            <Input id="problem-name" name="name" autoComplete="name" maxLength={120} className="h-11 bg-surface text-base" />
          </Field>
          {error ? <ErrorLine message={error} /> : null}
          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button type="submit" disabled={reporting} className="h-12 w-full text-base hover:bg-cleared-strong sm:flex-1">
              {reporting ? <Spinner aria-hidden /> : null}
              {reporting ? "Sending…" : `Send note to ${firstName}`}
            </Button>
            <Button type="button" variant="ghost" className="h-12 w-full text-base sm:w-auto sm:px-5" onClick={() => setMode("confirm")}>
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md border border-risk/25 bg-risk-tint px-3 py-2 text-sm text-risk">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}
