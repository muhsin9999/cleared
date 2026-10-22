import { BotMessageSquareIcon, BrushCleaningIcon, ClockIcon, FileCheckIcon, SendIcon, ShieldAlertIcon, ShieldCheckIcon, SparklesIcon, UserIcon, WebhookIcon, type LucideIcon } from "lucide-react";
import { siCloudflare, siNeon, siNextdotjs, siPaypal, siRender } from "simple-icons";
import { AgentAvatar } from "@/components/brand/agent-avatar";
import type { Logo } from "@/lib/architecture";
import { cn } from "@/lib/utils";

// Real brand marks where a vendor is the node (simple-icons, CC0), and plain icons for Cleared's own parts.
const BRANDS = { paypal: siPaypal, render: siRender, neon: siNeon, cloudflare: siCloudflare, nextjs: siNextdotjs } as const;
const ICONS: Partial<Record<Logo, LucideIcon>> = { person: UserIcon, webhook: WebhookIcon, page: FileCheckIcon, clock: ClockIcon, shield: ShieldCheckIcon, guard: ShieldAlertIcon, send: SendIcon, sparkle: SparklesIcon, broom: BrushCleaningIcon, openai: BotMessageSquareIcon };

export function NodeLogo({ logo, className }: { logo: Logo; className?: string }) {
  if (logo === "agent") return <AgentAvatar mood="idle" calm label="" className={cn("size-9", className)} />;
  if (logo in BRANDS) {
    const icon = BRANDS[logo as keyof typeof BRANDS];
    return (
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg border bg-white", className)}>
        <svg viewBox="0 0 24 24" role="img" aria-label={icon.title} className="size-5" fill={`#${icon.hex}`}>
          <path d={icon.path} />
        </svg>
      </span>
    );
  }
  const Icon = ICONS[logo] ?? SparklesIcon;
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg border bg-paper text-ink", logo === "shield" || logo === "send" ? "text-cleared" : logo === "guard" && "text-caution", className)}>
      <Icon aria-hidden className="size-[18px]" />
    </span>
  );
}
