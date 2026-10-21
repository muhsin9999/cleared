import type { Metadata } from "next";
import { SiteFooter, SiteHeader, GITHUB_URL } from "@/components/marketing/site-chrome";

export const metadata: Metadata = {
  title: "Legal and privacy",
  description: "Cleared is an independent hackathon project that works with the PayPal sandbox. What it stores, how it uses AI, and how to reach us.",
};

const SECTIONS = [
  { id: "affiliation", title: "Not affiliated with PayPal" },
  { id: "sandbox", title: "Sandbox only" },
  { id: "data", title: "What we store" },
  { id: "ai", title: "How the AI is used" },
  { id: "contact", title: "Contact" },
];

export default function LegalPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 pt-10 pb-24 sm:px-6 sm:pt-16 lg:grid-cols-[14rem_1fr]">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <p className="font-mono text-[0.72rem] font-medium tracking-[0.1em] text-cleared-strong uppercase">Legal</p>
            <nav aria-label="On this page" className="mt-4 hidden lg:block">
              <ul className="space-y-1 border-l border-line text-sm">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="-ml-px block border-l border-transparent py-1 pl-4 text-muted-foreground hover:border-ink hover:text-ink">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="max-w-[40rem]">
            <h1 className="text-4xl font-semibold tracking-[-0.035em] text-balance text-ink sm:text-5xl">Legal and privacy</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Cleared is an independent project built for the PayPal AI Hackathon. This page explains, in plain words, what it is, what it
              keeps, and how it uses AI.
            </p>
            <p className="mt-3 font-mono text-xs text-muted-foreground">Last updated October 20, 2026</p>

            <div className="mt-12 space-y-12 text-[0.98rem] leading-[1.7] text-ink/90 [&_h2]:scroll-mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-ink [&_li]:pl-1 [&_p+p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:marker:text-muted-foreground">
              <section aria-labelledby="affiliation">
                <h2 id="affiliation">Not affiliated with PayPal</h2>
                <p className="mt-3">
                  Cleared works with PayPal&apos;s public developer APIs. It is not affiliated with, endorsed by, or sponsored by PayPal. PayPal is
                  a trademark of PayPal, Inc., and is used here only to describe what Cleared works with.
                </p>
                <p>
                  Cleared helps you prepare. It does not decide anything on PayPal&apos;s behalf and cannot promise that a payment will be released,
                  a hold lifted or a dispute won.
                </p>
              </section>

              <section aria-labelledby="sandbox">
                <h2 id="sandbox">Sandbox only</h2>
                <p className="mt-3">
                  Every PayPal call this deployment makes goes to the PayPal sandbox, PayPal&apos;s test environment. No real money moves, and no
                  real PayPal account is connected. Demo workspaces share one sandbox business account.
                </p>
              </section>

              <section aria-labelledby="data">
                <h2 id="data">What we store</h2>
                <ul>
                  <li>Workspace details you enter: a display name, what you sell, typical price and delivery time.</li>
                  <li>Sales, invoices and the files you add to a proof locker.</li>
                  <li>
                    When a client confirms they received the work on an acceptance page: the time, their IP address, their browser&apos;s user
                    agent and, if they give it, their name. This is the record of acceptance.
                  </li>
                  <li>PayPal webhook events for the sandbox account, and a log of every AI call and every request sent to PayPal.</li>
                  <li>A session cookie that keeps you in your demo workspace. There are no analytics or advertising cookies.</li>
                </ul>
                <p className="mt-4">
                  Please don&apos;t upload real personal or financial documents. Demo data can be reset at any time and is not kept after the
                  hackathon ends.
                </p>
              </section>

              <section aria-labelledby="ai">
                <h2 id="ai">How the AI is used</h2>
                <p className="mt-3">
                  Cleared uses OpenAI&apos;s <span className="font-mono text-[0.9em]">gpt-5.4-mini</span> model to read a sale description, a
                  PayPal notice or a dispute, and to draft suggestions, invoice wording and evidence packets.
                </p>
                <ul>
                  <li>The AI only drafts. Every output is labelled as drafted by Cleared AI.</li>
                  <li>You approve every step. Nothing is sent to PayPal or to your client until you choose to send it.</li>
                  <li>A separate check removes any claim in a packet that your proof doesn&apos;t support, and lists it as missing evidence.</li>
                  <li>You can see exactly what was sent to the model and what came back in the AI audit log under Settings.</li>
                </ul>
              </section>

              <section aria-labelledby="contact">
                <h2 id="contact">Contact</h2>
                <p className="mt-3">
                  Questions, corrections or a request to remove data:{" "}
                  <a href={`${GITHUB_URL}/issues`} className="font-medium text-cleared-strong underline decoration-cleared/30 underline-offset-4 hover:decoration-cleared">
                    open an issue on GitHub
                  </a>
                  . The source code is public under the MIT licence.
                </p>
              </section>
            </div>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
