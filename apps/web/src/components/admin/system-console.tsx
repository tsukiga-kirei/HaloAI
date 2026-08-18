"use client";

import { Activity, Building2, Cpu, LayoutDashboard, Settings2 } from "lucide-react";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { animateManagementSection } from "@/lib/motion";
import { systemAdminDictionaries, type SystemAdminDictionary } from "@/lib/system-admin-i18n";
import { isSystemSection, type SystemSection } from "@/lib/system-sections";
import { ManagementShell } from "./management-shell";

const navigation = [
  { section: "overview", href: "/system" as Route, icon: LayoutDashboard, labelKey: "navOverview" },
  { section: "tenants", href: "/system/tenants" as Route, icon: Building2, labelKey: "navTenants" },
  { section: "models", href: "/system/models" as Route, icon: Cpu, labelKey: "navModels" },
  { section: "health", href: "/system/health" as Route, icon: Activity, labelKey: "navHealth" },
  {
    section: "settings",
    href: "/system/settings" as Route,
    icon: Settings2,
    labelKey: "navSettings",
  },
] as const;

function sectionFromPath(pathname: string): SystemSection {
  if (pathname === "/system" || pathname === "/system/") return "overview";
  const value = pathname.split("/")[2] ?? "overview";
  return isSystemSection(value) ? value : "overview";
}

function titleFrom(section: SystemSection, dictionary: SystemAdminDictionary): string {
  if (section === "tenants") return dictionary.tenantsTitle;
  if (section === "models") return dictionary.modelsTitle;
  if (section === "health") return dictionary.healthTitle;
  if (section === "settings") return dictionary.settingsTitle;
  return dictionary.overviewTitle;
}

/**
 * 系统管理外壳挂在布局层，分区切换只替换画布。侧栏不得随页面重挂载而播放收起动画。
 */
export function SystemConsole({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const section = sectionFromPath(pathname);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    return animateManagementSection(contentRef.current);
  }, [pathname]);

  return (
    <ManagementShell
      titleKey="systemConsoleTitle"
      navLabelKey="systemNavLabel"
      portalKey="system_admin"
      activeHref={section === "overview" ? "/system" : `/system/${section}`}
      items={navigation.map((item) => ({
        href: item.href,
        labelKey: item.labelKey,
        icon: item.icon,
      }))}
    >
      {(_adminDictionary, locale) => {
        const dictionary = systemAdminDictionaries[locale];
        return (
          <div className="system-console" ref={contentRef}>
            <div className="admin-section-heading">
              <h1>{titleFrom(section, dictionary)}</h1>
            </div>
            {children}
          </div>
        );
      }}
    </ManagementShell>
  );
}
