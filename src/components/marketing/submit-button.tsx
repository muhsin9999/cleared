"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/** A submit button for server-action forms that says what is happening while the action runs. */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "default",
  size,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <>
      <Button type="submit" variant={variant} size={size} disabled={pending} aria-disabled={pending} className={cn(className)}>
        {pending ? <Spinner aria-hidden /> : null}
        {pending ? pendingLabel : children}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {pending ? pendingLabel : ""}
      </span>
    </>
  );
}

/** The quiet alternative to a SubmitButton: a submit control that reads as an underlined text link. */
export function TextSubmit({ children, pendingLabel, className }: { children: React.ReactNode; pendingLabel: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm text-[0.95rem] text-ink/75 underline decoration-ink/25 underline-offset-[5px] transition-colors hover:text-ink hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:opacity-60",
          className,
        )}
      >
        {pending ? <Spinner aria-hidden className="size-3.5" /> : null}
        {pending ? pendingLabel : children}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {pending ? pendingLabel : ""}
      </span>
    </>
  );
}
