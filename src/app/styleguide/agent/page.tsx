import { AgentAvatar, type AgentMood } from "@/components/brand/agent-avatar";
import { AgentTag } from "@/components/brand/marks";

export const metadata = { title: "Agent", robots: { index: false } };

const MOODS: AgentMood[] = ["idle", "working", "thinking", "concerned", "done"];

// Cleared AI's face in every mood, for design review.
export default function AgentPreview() {
  return (
    <main className="mx-auto min-h-svh max-w-4xl space-y-12 bg-paper px-5 py-12">
      <div className="flex flex-wrap items-end gap-10">
        {MOODS.map((m) => (
          <figure key={m} className="space-y-3 text-center">
            <AgentAvatar mood={m} className="size-24" />
            <figcaption className="font-mono text-xs text-muted-foreground">{m}</figcaption>
          </figure>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-6">
        {MOODS.map((m) => <AgentAvatar key={m} mood={m} className="size-8" />)}
        <AgentTag className="text-sm" />
      </div>
    </main>
  );
}
