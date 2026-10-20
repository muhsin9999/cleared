"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

type LiveEvent = { id: string; type: string; summary: string; saleId: string | null };

const POLL_MS = 5_000;

/** Watches for new PayPal events while the tab is visible: shows a toast and refreshes the page data. */
export function LiveEvents() {
  const router = useRouter();
  const since = useRef<string | null>(null);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    async function tick() {
      if (document.visibilityState === "visible") {
        try {
          const url = since.current ? `/api/events/latest?after=${encodeURIComponent(since.current)}` : "/api/events/latest";
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            const { events, now } = (await res.json()) as { events: LiveEvent[]; now: string };
            const fresh = since.current ? events.filter((e) => !seen.current.has(e.id)) : [];
            events.forEach((e) => seen.current.add(e.id));
            since.current = now;
            for (const e of fresh.reverse()) {
              const fromPayPal = /^(INVOICING|PAYMENT|CHECKOUT|CUSTOMER)\./.test(e.type);
              (e.type.includes("DISPUTE.CREATED") ? toast.warning : toast.success)(e.summary, { description: fromPayPal ? "Verified event from PayPal" : undefined });
            }
            if (fresh.length) router.refresh();
          }
        } catch {
          // Offline or server restarting: try again on the next tick.
        }
      }
      if (!stopped) timer = setTimeout(tick, POLL_MS);
    }

    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [router]);

  return null;
}
