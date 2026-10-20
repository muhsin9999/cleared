"use client";

import NumberFlow from "@number-flow/react";

export function MoneyFlow({ cents, className }: { cents: number; className?: string }) {
  return <NumberFlow className={className} value={cents / 100} format={{ style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 }} />;
}
