// Display helpers shared by server and client components.
const DAY = 86_400_000;

export function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}

export function daysUntil(date: Date | string | null | undefined, now = Date.now()) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - now) / DAY);
}

export function shortDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));
}

export function relativeTime(date: Date | string, now = Date.now()) {
  const diff = new Date(date).getTime() - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute");
  if (abs < DAY) return rtf.format(Math.round(diff / 3_600_000), "hour");
  return rtf.format(Math.round(diff / DAY), "day");
}

export const SALE_STATUS_LABEL = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  delivered: "Delivered",
  accepted: "Accepted",
  released: "Released",
  disputed: "Disputed",
  refunded: "Refunded",
} as const;
