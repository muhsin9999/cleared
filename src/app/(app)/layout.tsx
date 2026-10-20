import { Suspense } from "react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { LiveEvents } from "@/components/app/live-events";
import { MobileTabs } from "@/components/app/mobile-tabs";
import { Topbar } from "@/components/app/topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider className="min-h-svh bg-paper">
      <Suspense fallback={<div className="hidden w-60 border-r bg-sidebar md:block" />}>
        <AppSidebar footer={<p className="text-xs text-muted-foreground">PayPal sandbox · not affiliated with PayPal</p>} />
      </Suspense>
      <SidebarInset className="min-w-0 bg-paper pb-20 md:pb-0">
        <Topbar />
        {children}
      </SidebarInset>
      <Suspense>
        <MobileTabs />
      </Suspense>
      <LiveEvents />
    </SidebarProvider>
  );
}
