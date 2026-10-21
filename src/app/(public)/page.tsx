import type { Metadata } from "next";
import { ClosingCta, ForJudges, Hero, HowItWorks, SellersWords, TheNumbers } from "@/components/marketing/landing";
import { AgentSection } from "@/components/marketing/agent-scene";
import { GITHUB_URL, SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";

export const metadata: Metadata = {
  title: { absolute: "cleared: get paid, and stay paid" },
};

export default function LandingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-soft">
        Skip to content
      </a>
      <SiteHeader overlay />
      <main id="main" className="flex-1">
        <Hero />
        <AgentSection githubUrl={GITHUB_URL} />
        <TheNumbers />
        <HowItWorks />
        <SellersWords />
        <ForJudges />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  );
}
