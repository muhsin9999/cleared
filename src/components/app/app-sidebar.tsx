"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { isActive, NAV } from "./nav";

export function AppSidebar({ footer }: { footer?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="none" className="sticky top-0 hidden h-svh w-60 border-r border-sidebar-border md:flex">
      <SidebarHeader className="gap-5 px-4 pt-5">
        <Link href="/home" aria-label="cleared home" className="rounded-md">
          <Logo />
        </Link>
        <Link href="/sales/new" className={cn(buttonVariants({ size: "lg" }), "w-full justify-center")}>
          <PlusIcon aria-hidden /> New sale
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 pt-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {NAV.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    isActive={isActive(pathname, href)}
                    render={<Link href={href} aria-current={isActive(pathname, href) ? "page" : undefined} />}
                    className="h-9 text-[0.9rem] data-[active]:font-medium"
                  >
                    <Icon aria-hidden />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {footer ? <SidebarFooter className="px-4 pb-4">{footer}</SidebarFooter> : null}
    </Sidebar>
  );
}
