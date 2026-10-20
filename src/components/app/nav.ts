import { ActivityIcon, BriefcaseIcon, HouseIcon, type LucideIcon, SettingsIcon, ShieldAlertIcon } from "lucide-react";

export const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/home", label: "Home", icon: HouseIcon },
  { href: "/sales", label: "Sales", icon: BriefcaseIcon },
  { href: "/cases", label: "Cases", icon: ShieldAlertIcon },
  { href: "/activity", label: "Activity", icon: ActivityIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
