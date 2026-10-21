"use client";

import { RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Shown inside the app shell when a page fails to load, so the sidebar and sandbox controls stay usable.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-start gap-4 px-4 py-16 sm:px-8">
      <p className="font-mono text-sm text-muted-foreground">Something went wrong</p>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">This page didn’t load</h1>
      <p className="text-muted-foreground text-pretty">Nothing was sent to PayPal. It’s usually a slow connection to the sandbox; trying again normally works.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={reset}><RotateCcwIcon aria-hidden /> Try again</Button>
        <Button variant="outline" render={<Link href="/home" />}>Go to Home</Button>
      </div>
      {error.digest ? <p className="font-mono text-xs text-muted-foreground">Reference {error.digest}</p> : null}
    </div>
  );
}
