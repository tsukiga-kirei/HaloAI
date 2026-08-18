"use client";

import { Activity, Building2, Cpu, LayoutDashboard, Settings2 } from "lucide-react";
import type { Route } from "next";
import { useLayoutEffect, useRef } from "react";
import { animateManagementSection } from "@/lib/motion";
import { systemAdminDictionaries, type SystemAdminDictionary } from "@/lib/system-admin-i18n";
import { type SystemSection } from "@/lib/system-sections";
import { ManagementShell } from "./management-shell";
import { SystemHealthSection } from "./system-health-section";
import { SystemModelsSection } from "./system-models-section";
import { SystemOverviewSection } from "./system-overview-section";
import { SystemSettingsSection } from "./system-settings-section";
import { SystemTenantsSection } from "./system-tenants-section";

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

function titleFrom(section: SystemSection, dictionary: SystemAdminDictionary): string {
  if (section === "tenants") return dictionary.tenantsTitle;
  if (section === "models") return dictionary.modelsTitle;
  if (section === "health") return dictionary.healthTitle;
  if (section === "settings") return dictionary.settingsTitle;
  return dictionary.overviewTitle;
}

/**
 * 系统管理只组合平台级分区，不读取租户房间、文档或对话内容。每个分区自行读取受保护 API，
 * 统一外壳负责导航、主题、语言和进入动效。
 */
export function SystemConsole({ section }: { section: SystemSection }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    return animateManagementSection(contentRef.current);
  }, [section]);

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
            {section === "overview" ? <SystemOverviewSection dictionary={dictionary} /> : null}
            {section === "tenants" ? (
              <SystemTenantsSection dictionary={dictionary} locale={locale} />
            ) : null}
            {section === "models" ? <SystemModelsSection dictionary={dictionary} /> : null}
            {section === "health" ? <SystemHealthSection dictionary={dictionary} /> : null}
            {section === "settings" ? <SystemSettingsSection dictionary={dictionary} /> : null}
          </div>
        );
      }}
    </ManagementShell>
  );
}
