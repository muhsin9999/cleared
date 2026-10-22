import { BadgeCheckIcon, CircleAlertIcon, CircleDollarSignIcon, FileUpIcon, FlaskConicalIcon, GavelIcon, LockOpenIcon, PackageIcon, SendIcon, UserCheckIcon, type LucideIcon } from "lucide-react";
import { AgentAvatar } from "@/components/brand/agent-avatar";
import { cn } from "@/lib/utils";

export type EventLike = { id: string; type: string; summary: string; occurredAt: Date; simulated: boolean; verified: boolean; source: string };

// One line per event: an icon for the kind, a short label, and the time. The full sentence stays in the tooltip.
const KIND: Record<string, { icon: LucideIcon; tone?: "risk" | "good"; label?: string }> = {
  "CUSTOMER.DISPUTE.CREATED": { icon: CircleAlertIcon, tone: "risk", label: "Dispute opened" },
  "CUSTOMER.DISPUTE.RESOLVED": { icon: GavelIcon, tone: "good" },
  "DISPUTE.EVIDENCE_SUBMITTED": { icon: SendIcon, label: "Reply sent to PayPal" },
  "CLIENT.REPORTED_PROBLEM": { icon: CircleAlertIcon, tone: "risk" },
  "INVOICING.INVOICE.PAID": { icon: CircleDollarSignIcon, tone: "good" },
  "INVOICING.INVOICE.SENT": { icon: SendIcon },
  "FUNDS.RELEASED": { icon: LockOpenIcon, tone: "good" },
  "CLIENT.ACCEPTED": { icon: UserCheckIcon, tone: "good", label: "Client confirmed receipt" },
  "SALE.COMPLETED_MARKED": { icon: BadgeCheckIcon, label: "Marked complete in PayPal" },
  "PROOF.FILES_ADDED": { icon: FileUpIcon, label: "Files added" },
  "PROOF.FILE_ADDED": { icon: FileUpIcon },
  "PROOF.MESSAGE_ADDED": { icon: FileUpIcon },
  "TRACKING.ADDED": { icon: PackageIcon },
  "PACKET.DRAFTED": { icon: BadgeCheckIcon, label: "drafted the reply to PayPal" },
  "PREFLIGHT.COMPLETED": { icon: BadgeCheckIcon, label: "checked the sale" },
};
// Events the AI produced: they show its face so the feed says what the agent did and when.
const AI_EVENTS = new Set(["PACKET.DRAFTED", "PREFLIGHT.COMPLETED"]);

/** The words a row shows, for search. */
export const eventText = (e: EventLike) => `${AI_EVENTS.has(e.type) ? "Cleared AI " : ""}${KIND[e.type]?.label ?? e.summary} ${e.summary}`;

export const EVENT_GROUPS = {
  disputes: (t: string) => t.includes("DISPUTE") || t === "CLIENT.REPORTED_PROBLEM",
  payments: (t: string) => t.startsWith("INVOICING.") || t.startsWith("FUNDS.") || t.startsWith("SALE."),
  proof: (t: string) => t.startsWith("PROOF.") || t.startsWith("TRACKING.") || t === "CLIENT.ACCEPTED",
  ai: (t: string) => AI_EVENTS.has(t),
};

function ago(d: Date, now: number) {
  const s = (now - d.getTime()) / 1000;
  if (s < 90) return "now";
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86_400) return `${Math.round(s / 3600)}h`;
  if (s < 7 * 86_400) return `${Math.round(s / 86_400)}d`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

export function EventRow({ event, now }: { event: EventLike; now: number }) {
  const k = KIND[event.type] ?? { icon: BadgeCheckIcon };
  const ai = AI_EVENTS.has(event.type);
  // Only events PayPal itself sent: a webhook whose signature PayPal confirmed, or a sandbox dispute read from its API.
  const fromPayPal = event.source === "paypal" && event.verified && !event.simulated;
  return (
    <li className="flex items-center gap-3 py-2" title={event.summary}>
      {ai ? (
        <AgentAvatar calm label="" className="size-6" />
      ) : (
        <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", k.tone === "risk" ? "bg-risk-tint text-risk" : k.tone === "good" ? "bg-cleared-tint text-cleared-strong" : "bg-muted text-muted-foreground")}>
          <k.icon aria-hidden className="size-3.5" />
        </span>
      )}
      <p className="min-w-0 flex-1 truncate text-sm">
        {ai ? <span className="font-medium">Cleared AI </span> : null}
        {k.label ?? event.summary}
      </p>
      {event.simulated ? (
        <FlaskConicalIcon role="img" aria-label="Sandbox test event" className="size-3.5 shrink-0 text-caution" />
      ) : fromPayPal ? (
        <span className="shrink-0 rounded bg-cleared-tint px-1.5 py-0.5 text-[0.65rem] font-medium text-cleared-strong" title={`From PayPal: ${event.type}`}>PayPal</span>
      ) : null}
      <time className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums" dateTime={event.occurredAt.toISOString()} title={event.occurredAt.toUTCString()}>{ago(event.occurredAt, now)}</time>
    </li>
  );
}

export function EventList({ events, now }: { events: EventLike[]; now: number }) {
  return <ol className="-my-2 divide-y">{events.map((e) => <EventRow key={e.id} event={e} now={now} />)}</ol>;
}
