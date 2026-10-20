"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isActive, NAV } from "./nav";

export function MobileTabs() {
  const pathname = usePathname();
  return (
    <>
      <Link
        href="/sales/new"
        aria-label="New sale"
        className="fixed right-4 bottom-20 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft md:hidden"
      >
        <PlusIcon aria-hidden />
      </Link>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex flex-col items-center gap-1 py-2.5 text-[0.7rem] text-muted-foreground", active && "font-medium text-cleared")}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
