// Approximate list prices (USD per million tokens); shown as estimates only.
export const PRICES: Record<string, { input: number; cached: number; output: number }> = {
  "gpt-5.4-mini": { input: 0.75, cached: 0.075, output: 4.5 },
  "gpt-5.4": { input: 2.5, cached: 0.25, output: 15 },
};

export function costOf(usage: { input?: number; cached?: number; output?: number } | null | undefined, model = "gpt-5.4-mini") {
  if (!usage) return null;
  const p = PRICES[model] ?? PRICES["gpt-5.4-mini"];
  const cached = usage.cached ?? 0;
  return (((usage.input ?? 0) - cached) * p.input + cached * p.cached + (usage.output ?? 0) * p.output) / 1e6;
}
