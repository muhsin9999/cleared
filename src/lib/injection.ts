// Validates the agent's "ignored instructions" (docs/AI.md guardrail 3). The model suggests; code keeps a flag
// only if the quoted text really appears in the case and is addressed to an AI or tries to steer the outcome.
const AIMED = /\b(ignore|disregard|instructions?|system|prompt|ai\b|assistant|model|reviewer|recommend|tell paypal|write that|say that|state that|you must|override)\b/i;

const norm = (s: string) => s.toLowerCase().replace(/[“”"'‘’]/g, "").replace(/\s+/g, " ").trim();

export function confirmInjections(flags: string[], sources: (string | null | undefined)[]) {
  const haystack = norm(sources.filter(Boolean).join(" \n "));
  return flags.filter((f) => {
    const q = norm(f).replace(/^\.+|\.+$/g, "").replace(/…/g, "");
    // Accept a flag when a solid run of its words is really in the case text.
    const words = q.split(" ");
    const found = words.length <= 4 ? haystack.includes(q) : Array.from({ length: words.length - 3 }, (_, i) => words.slice(i, i + 4).join(" ")).some((w) => haystack.includes(w));
    return found && AIMED.test(q);
  });
}
