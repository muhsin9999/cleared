import type { CSSProperties } from "react";
import { StampMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

// The agent's marks, shared by the landing page's agent scene and the case room so the product looks the
// way the page promises: every mark the AI makes is signed "Cleared AI", and struck text gets a red marker.

/** A slightly wavy marker line, stretched across text as a background image. */
export function strikeImage(color: string) {
  return `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 10' preserveAspectRatio='none'><path d='M0 5.6 C 20 4.2, 40 6.6, 60 5 S 100 4.6, 120 5.4' fill='none' stroke='${color}' stroke-width='2.1' stroke-linecap='round'/></svg>`,
  )}")`;
}

/** Struck through with a red marker; `box-decoration-break: clone` gives each wrapped line its own stroke. */
export function markerStrike(color: string): CSSProperties {
  return { backgroundImage: strikeImage(color), backgroundRepeat: "no-repeat", backgroundPosition: "0 56%", backgroundSize: "100% 0.55em", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" };
}

export function AgentMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full bg-[#1F7A55]", className)}>
      <StampMark detail="simple" className="size-[70%] text-white" />
    </span>
  );
}

/** The agent's name tag, like a collaborator's label in a shared document. Sized in em: set the font size on a parent. */
export function AgentTag({ children = "Cleared AI", className }: { children?: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.35em] rounded-full bg-[#12191c] py-[0.18em] pr-[0.6em] pl-[0.2em] font-semibold whitespace-nowrap text-white", className)}>
      <AgentMark className="size-[1.35em]" />
      {children}
    </span>
  );
}
