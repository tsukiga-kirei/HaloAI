"use client";

import { Activity, Building2, Cpu, LayoutDashboard, Settings2 } from "lucide-react";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { AdminPageHeader } from "./admin-page-header";
import { ManagementShell, type ManagementNavSection } from "./management-shell";
import { animateManagementSection } from "@/lib/motion";
import { systemAdminDictionaries, type SystemAdminDictionary } from "@/lib/system-admin-i18n";
import { isSystemSection, type SystemSection } from "@/lib/system-sections";
import type { AdminDictionary } from "@/lib/admin-i18n";

const navigation: ReadonlyArray<ManagementNavSection> = [
  {
    id: "platform",
    titleKey: "navGroupPlatform",
    items: [{ href: "/system" as Route, icon: LayoutDashboard, labelKey: "navOverview" }],
  },
  {
    id: "catalog",
    titleKey: "navGroupCatalog",
    items: [
      { href: "/system/tenants" as Route, icon: Building2, labelKey: "navTenants" },
      { href: "/system/models" as Route, icon: Cpu, labelKey: "navModels" },
    ],
  },
  {
    id: "operations",
    titleKey: "navGroupOperations",
    items: [
      { href: "/system/health" as Route, icon: Activity, labelKey: "navHealth" },
      { href: "/system/settings" as Route, icon: Settings2, labelKey: "navSettings" },
    ],
  },
];

function sectionFromPath(pathname: string): SystemSection {
  if (pathname === "/system" || pathname === "/system/") return "overview";
  const value = pathname.split("/")[2] ?? "overview";
  return isSystemSection(value) ? value : "overview";
}

function chromeFrom(
  section: SystemSection,
  dictionary: SystemAdminDictionary,
  admin: AdminDictionary,
): { kicker: string; title: string } {
  if (section === "tenants") {
    return { kicker: admin.navGroupCatalog, title: dictionary.tenantsTitle };
  }
  if (section === "models") {
    return { kicker: admin.navGroupCatalog, title: dictionary.modelsTitle };
  }
  if (section === "health") {
    return { kicker: admin.navGroupOperations, title: dictionary.healthTitle };
  }
  if (section === "settings") {
    return { kicker: admin.navGroupOperations, title: dictionary.settingsTitle };
  }
  return { kicker: admin.navGroupPlatform, title: dictionary.overviewTitle };
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
      navLabelKey="systemNavLabel"
      portalKey="system_admin"
      activeHref={section === "overview" ? "/system" : `/system/${section}`}
      sections={navigation}
    >
      {(adminDictionary, locale) => {
        const dictionary = systemAdminDictionaries[locale];
        const chrome = chromeFrom(section, dictionary, adminDictionary);
        return (
          <div className="system-console" ref={contentRef}>
            <AdminPageHeader kicker={chrome.kicker} title={chrome.title} />
            {children}
          </div>
        );
      }}
    </ManagementShell>
  );
}
