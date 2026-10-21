import { AgentScene } from "@/components/marketing/agent-scene";

export const metadata = { title: "Agent scene (mock)", robots: { index: false } };

// Design mock of the landing section "Watch the agent build the case" (two static frames).
export default function AgentSceneMock() {
  return (
    <main className="min-h-svh bg-paper-deep">
      {(["investigating", "done"] as const).map((frame) => (
        <section key={frame} id={frame} className="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8">
          <p className="text-sm font-medium text-cleared-strong">When a buyer disputes</p>
          <h2 className="mt-2 max-w-3xl text-[2.2rem] leading-tight font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[3rem]">
            An AI agent builds your case. You make the call.
          </h2>
          <div className="mt-10">
            <AgentScene frame={frame} />
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              ["It only reads", "Seven read-only tools. It can open the case, never send to PayPal."],
              ["Code checks every claim", "Dates, amounts and files must be in the exhibit cited, or the claim is struck."],
              ["You approve", "Nothing reaches PayPal until you press the button."],
            ].map(([t, d]) => (
              <div key={t} className="border-t border-ink/15 pt-4">
                <p className="font-semibold text-ink">{t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 font-mono text-sm text-ink/80">
            <span><b className="text-ink">36/36</b> right calls</span>
            <span><b className="text-ink">6/6</b> hidden instructions ignored</span>
            <span><b className="text-ink">&lt;1¢</b> per case</span>
            <span className="text-muted-foreground">12 scenarios × 3 runs · evals/README.md</span>
          </div>
        </section>
      ))}
    </main>
  );
}
