import { CheckCircle2Icon, FlaskConicalIcon } from "lucide-react";
import { AgentTag } from "@/components/brand/marks";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type EventLike = { id: string; type: string; summary: string; occurredAt: Date; simulated: boolean; verified: boolean; source: string };

const tone = (type: string) =>
  type.includes("DISPUTE.CREATED") || type.includes("REPORTED_PROBLEM") || type.includes("PHISHING")
    ? "bg-risk"
    : type.includes("EVIDENCE_SUBMITTED") || type.endsWith("DISPUTE.RESOLVED")
      ? "bg-cleared"
      : type.includes("DISPUTE")
        ? "bg-caution"
        : "bg-cleared";

// Events the AI produced. They carry its name tag so the feed shows what the agent did and when.
const AI_EVENTS = new Set(["PACKET.DRAFTED", "PREFLIGHT.COMPLETED"]);

export function EventRow({ event, now }: { event: EventLike; now: number }) {
  return (
    <li className="relative flex gap-3 pb-5 pl-1 last:pb-0">
      <span aria-hidden className={cn("relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-surface", tone(event.type))} />
      <div className="min-w-0 flex-1">
        <p className="text-[0.95rem] text-pretty">
          {AI_EVENTS.has(event.type) ? <><AgentTag className="mr-1 align-[0.08em] text-[0.7rem]" /> </> : null}
          {event.summary}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <time dateTime={event.occurredAt.toISOString()} title={event.occurredAt.toUTCString()}>{relativeTime(event.occurredAt, now)}</time>
          {event.simulated ? (
            <span className="inline-flex items-center gap-1 text-caution"><FlaskConicalIcon aria-hidden className="size-3" /> sandbox test event</span>
          ) : event.source === "paypal" && event.verified ? (
            // Only events PayPal itself sent (a webhook whose signature PayPal confirmed, or a sandbox dispute read from its API).
            <span className="inline-flex items-center gap-1 font-medium text-cleared" title={event.type}><CheckCircle2Icon aria-hidden className="size-3" /> From PayPal</span>
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
