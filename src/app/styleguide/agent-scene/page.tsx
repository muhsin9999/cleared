import { AgentSection } from "@/components/marketing/agent-scene";
import { GITHUB_URL } from "@/components/marketing/site-chrome";

export const metadata = { title: "Agent scene", robots: { index: false } };

// The landing section on its own, for design review.
export default function AgentScenePreview() {
  return (
    <main className="min-h-svh bg-paper">
      <AgentSection githubUrl={GITHUB_URL} />
    </main>
  );
}
