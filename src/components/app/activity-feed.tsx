"use client";

import { useMemo, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EVENT_GROUPS, EventList, type EventLike, eventText } from "./event-row";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "disputes", label: "Disputes" },
  { id: "payments", label: "Payments" },
  { id: "proof", label: "Proof" },
  { id: "ai", label: "Cleared AI" },
] as const;

// The full feed: a search box and a few filters over the latest events, so a long history stays easy to scan.
export function ActivityFeed({ events, now }: { events: EventLike[]; now: number }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return events.filter((e) => (filter === "all" || EVENT_GROUPS[filter](e.type)) && words.every((w) => eventText(e).toLowerCase().includes(w)));
  }, [events, q, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="text" role="searchbox" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activity" aria-label="Search activity" className="pr-8 pl-9" />
          {q ? (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:text-foreground">
              <XIcon aria-hidden className="size-3.5" />
            </button>
          ) : null}
        </div>
        <div role="group" aria-label="Filter" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", filter === f.id ? "border-ink bg-ink text-paper" : "bg-surface text-muted-foreground hover:text-foreground")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-[10px] border bg-surface px-4 py-2 sm:px-5">
        {shown.length ? <EventList events={shown} now={now} /> : <p className="py-8 text-center text-sm text-muted-foreground">{events.length ? "Nothing matches." : "Nothing yet. Events appear here the moment PayPal sends them."}</p>}
      </div>
      {shown.length ? <p className="text-center text-xs text-muted-foreground">{shown.length === events.length ? `${events.length} events` : `${shown.length} of ${events.length} events`}</p> : null}
    </div>
  );
}
