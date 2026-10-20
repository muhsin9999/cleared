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
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <>
      <Button type="submit" variant={variant} disabled={pending} aria-disabled={pending} className={cn(className)}>
        {pending ? <Spinner aria-hidden /> : null}
        {pending ? pendingLabel : children}
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {pending ? pendingLabel : ""}
      </span>
    </>
  );
}
