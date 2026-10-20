import { CheckCircle2Icon, FlaskConicalIcon } from "lucide-react";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type EventLike = { id: string; type: string; summary: string; occurredAt: Date; simulated: boolean; verified: boolean; source: string };

const tone = (type: string) =>
  type.includes("DISPUTE.CREATED") || type.includes("REPORTED_PROBLEM")
    ? "bg-risk"
    : type.includes("EVIDENCE_SUBMITTED") || type.endsWith("DISPUTE.RESOLVED")
      ? "bg-cleared"
      : type.includes("DISPUTE")
        ? "bg-caution"
        : "bg-cleared";

export function EventRow({ event, now }: { event: EventLike; now: number }) {
  return (
    <li className="relative flex gap-3 pb-5 pl-1 last:pb-0">
      <span aria-hidden className={cn("relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-surface", tone(event.type))} />
      <div className="min-w-0 flex-1">
        <p className="text-[0.95rem] text-pretty">{event.summary}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <code className="font-mono text-[0.7rem] tracking-tight">{event.type}</code>
          <span aria-hidden>·</span>
          <time dateTime={event.occurredAt.toISOString()}>{relativeTime(event.occurredAt, now)}</time>
          {event.simulated ? (
            <span className="inline-flex items-center gap-1 text-caution"><FlaskConicalIcon aria-hidden className="size-3" /> simulated</span>
          ) : event.source === "paypal" && event.verified ? (
            <span className="inline-flex items-center gap-1 text-cleared"><CheckCircle2Icon aria-hidden className="size-3" /> verified by PayPal</span>
          ) : null}
        </p>
      </div>
    </li>
  );
}

export function EventList({ events, now }: { events: EventLike[]; now: number }) {
  return (
    <ol className="relative before:absolute before:top-2 before:bottom-2 before:left-[0.55rem] before:w-px before:bg-border">
      {events.map((e) => <EventRow key={e.id} event={e} now={now} />)}
    </ol>
  );
}
