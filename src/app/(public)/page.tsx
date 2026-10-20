import type { Metadata } from "next";
import { EvidenceStrip, ForJudges, Hero, HowItWorks, ProofPoints } from "@/components/marketing/landing";
import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";

export const metadata: Metadata = {
  title: { absolute: "cleared: get paid, and stay paid" },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow-soft">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Hero />
        <ProofPoints />
        <HowItWorks />
        <EvidenceStrip />
        <ForJudges />
      </main>
      <SiteFooter />
    </div>
  );
}
