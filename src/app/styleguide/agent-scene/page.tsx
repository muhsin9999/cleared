import { ArrowUpRight } from "lucide-react";
import { AgentScene } from "@/components/marketing/agent-scene";
import { GITHUB_URL } from "@/components/marketing/site-chrome";

export const metadata = { title: "Agent scene (mock)", robots: { index: false } };

// Design mock of the landing section "A buyer disputes. Cleared’s AI agent builds your case." (final frame).
export default function AgentSceneMock() {
  return (
    <main className="min-h-svh bg-paper">
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-[1280px] px-5 pt-20 pb-10 sm:px-8 lg:pt-28">
          <h2 className="max-w-3xl text-[2.2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance text-ink sm:text-[3.2rem]">
            A buyer disputes. Cleared’s AI agent builds your case.
          </h2>
          <p className="mt-4 max-w-xl text-[1.1rem] leading-relaxed text-ink/70">It reads your files, ties every claim to proof, and stops for your OK.</p>
        </div>
        <div className="mx-auto w-full max-w-[1440px] lg:px-8">
          <div className="overflow-hidden lg:rounded-[1.25rem]">
            <AgentScene />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-20 text-sm text-muted-foreground sm:px-8">
          <p>An example case. Every mark is a check Cleared runs on real disputes.</p>
          <a href={`${GITHUB_URL}/tree/main/evals`} className="inline-flex items-center gap-1 underline decoration-ink/25 underline-offset-4 hover:text-ink">
            See the evals <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </div>
      </section>
    </main>
  );
}
