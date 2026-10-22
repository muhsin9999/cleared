"use client";

import { m } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import { AgentAvatar, type AgentMood } from "@/components/brand/agent-avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { arriveDemoDispute } from "@/server/actions/demo";

// Home's first card: what Cleared AI is doing for the seller right now.

export function AgentCard({ mood, title, body, href, cta, tone }: { mood: AgentMood; title: string; body: string; href?: string; cta?: string; tone?: "risk" }) {
  return (
    <m.section
      aria-label="Cleared AI"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col gap-4 rounded-[10px] border bg-surface px-4 py-4 shadow-soft sm:flex-row sm:items-center sm:px-5", tone === "risk" && "border-risk/30")}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <AgentAvatar mood={mood} className="size-12 sm:size-14" />
        <div className="min-w-0">
          <p className="font-semibold text-pretty">{title}</p>
          <p className="text-sm text-muted-foreground text-pretty">{body}</p>
        </div>
      </div>
      {href && cta ? (
        <Link href={href} className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
          {cta} <ArrowRightIcon aria-hidden />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-cleared-strong sm:self-center">
          <span className="size-1.5 animate-pulse rounded-full bg-cleared" /> Connected to PayPal
        </span>
      )}
    </m.section>
  );
}

/** Demo only: watching for a moment, then the client's dispute arrives (a real sandbox one when in stock). */
export function DemoArrival({ body }: { body: string }) {
  const router = useRouter();
  const [arriving, setArriving] = useState(false);
  const fired = useRef(false);
  useEffect(() => {
    const t = setTimeout(async () => {
      if (fired.current) return;
      fired.current = true;
      setArriving(true);
      await arriveDemoDispute().catch(() => null);
      router.refresh();
    }, 3500);
    return () => clearTimeout(t);
  }, [router]);
  return <AgentCard mood={arriving ? "thinking" : "idle"} title={arriving ? "Something just came in from PayPal…" : "Watching your PayPal account"} body={body} />;
}
