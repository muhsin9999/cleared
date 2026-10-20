import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type AcceptanceRecord = { at: string; name?: string; ip: string; userAgent: string };

export function formatStamp(iso: string | Date) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(d);
  return `${date}, ${time} UTC`;
}

/** "Safari 19 on iPhone" style summary; already-short strings pass through. */
export function describeUserAgent(ua: string) {
  if (ua.length < 40) return ua;
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /curl\//.test(ua) ? "curl" : null;
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : null;
  if (browser && os) return `${browser} on ${os}`;
  return browser ?? os ?? `${ua.slice(0, 40)}…`;
}

export function maskIp(ip: string) {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return ip.split(".").slice(0, 2).concat("xx", "xx").join(".");
  if (ip.includes(":") && ip.length > 12) return `${ip.split(":").slice(0, 3).join(":")}:…`;
  return ip;
}

/** The timestamped confirmation record, shown after accepting and on revisits. */
export function ConfirmationRecord({ record, sellerName, className }: { record: AcceptanceRecord; sellerName: string; className?: string }) {
  const rows = [
    { k: "Confirmed", v: formatStamp(record.at) },
    ...(record.name ? [{ k: "By", v: record.name }] : []),
    { k: "Device", v: describeUserAgent(record.userAgent) },
    { k: "Network", v: maskIp(record.ip) },
  ];
  return (
    <div className={cn("overflow-hidden rounded-[10px] border border-cleared/25 bg-surface shadow-soft", className)}>
      <div className="flex items-start gap-3 bg-cleared-tint px-5 py-4">
        <BadgeCheck className="mt-0.5 size-5 shrink-0 text-cleared-strong" aria-hidden />
        <div>
          <p className="font-semibold tracking-[-0.01em] text-cleared-strong">You confirmed you received the work</p>
          <p className="mt-0.5 text-sm text-cleared-strong/85">{sellerName} has this record. You don&apos;t need to do anything else.</p>
        </div>
      </div>
      <dl className="divide-y divide-line px-5">
        {rows.map((r) => (
          <div key={r.k} className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-sm text-muted-foreground">{r.k}</dt>
            <dd className="text-right font-mono text-[0.8rem] text-ink tabular-nums">{r.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
