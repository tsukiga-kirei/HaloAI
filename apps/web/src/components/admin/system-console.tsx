"use client";

import { Activity, Building2, LayoutDashboard, ScrollText, ShieldCheck } from "lucide-react";
import type { Route } from "next";
import { ManagementShell } from "./management-shell";
import type { AdminDictionary } from "@/lib/admin-i18n";

export const systemSections = ["overview", "tenants", "health", "policy", "audit"] as const;
export type SystemSection = (typeof systemSections)[number];

const navigation = [
  { section: "overview", href: "/system" as Route, icon: LayoutDashboard, labelKey: "navOverview" },
  { section: "tenants", href: "/system/tenants" as Route, icon: Building2, labelKey: "navTenants" },
  { section: "health", href: "/system/health" as Route, icon: Activity, labelKey: "navHealth" },
  { section: "policy", href: "/system/policy" as Route, icon: ShieldCheck, labelKey: "navPolicy" },
  { section: "audit", href: "/system/audit" as Route, icon: ScrollText, labelKey: "navAudit" },
] as const;

function titleFrom(section: SystemSection, dictionary: AdminDictionary): string {
  if (section === "tenants") return dictionary.systemTenantsTitle;
  if (section === "health") return dictionary.systemHealthTitle;
  if (section === "policy") return dictionary.systemPolicyTitle;
  if (section === "audit") return dictionary.auditTitle;
  return dictionary.systemOverviewTitle;
}

/**
 * 系统管理预览不展示租户房间或文档内容，只展示平台级目录与健康状态。
 */
export function SystemConsole({ section }: { section: SystemSection }) {
  return (
    <ManagementShell
      titleKey="systemConsoleTitle"
      navLabelKey="systemNavLabel"
      activeHref={section === "overview" ? "/system" : `/system/${section}`}
      items={navigation.map((item) => ({
        href: item.href,
        labelKey: item.labelKey,
        icon: item.icon,
      }))}
    >
      {(dictionary) => (
        <>
          <div className="admin-section-heading">
            <h1>{titleFrom(section, dictionary)}</h1>
          </div>
          {section === "overview" ? (
            <section className="admin-metrics">
              <article className="admin-metric-card">
                <span>{dictionary.navTenants}</span>
                <strong>3</strong>
              </article>
              <article className="admin-metric-card">
                <span>{dictionary.navHealth}</span>
                <strong>{dictionary.statusActive}</strong>
              </article>
              <article className="admin-metric-card">
                <span>{dictionary.pendingApprovals}</span>
                <strong>0</strong>
              </article>
            </section>
          ) : null}
          {section === "tenants" || section === "overview" ? (
            <section className="admin-panel admin-table-panel">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{dictionary.tenantName}</th>
                    <th>{dictionary.tenantStatus}</th>
                    <th>{dictionary.tenantPlan}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>北辰产品组</td>
                    <td>{dictionary.statusActive}</td>
                    <td>Pilot</td>
                  </tr>
                  <tr>
                    <td>Aurora Labs</td>
                    <td>{dictionary.statusActive}</td>
                    <td>Pilot</td>
                  </tr>
                </tbody>
              </table>
            </section>
          ) : null}
          {section === "health" ? (
            <section className="admin-panel admin-table-panel">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{dictionary.healthService}</th>
                    <th>{dictionary.healthState}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>API</td>
                    <td>{dictionary.statusActive}</td>
                  </tr>
                  <tr>
                    <td>PostgreSQL</td>
                    <td>{dictionary.statusActive}</td>
                  </tr>
                  <tr>
                    <td>Worker</td>
                    <td>{dictionary.statusActive}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          ) : null}
          {section === "policy" ? (
            <section className="admin-security-grid">
              <article className="admin-security-card">
                <h2>{dictionary.securitySession}</h2>
                <p>{dictionary.securitySessionDetail}</p>
              </article>
              <article className="admin-security-card">
                <h2>{dictionary.securityRls}</h2>
                <p>{dictionary.securityRlsDetail}</p>
              </article>
            </section>
          ) : null}
          {section === "audit" ? (
            <section className="admin-panel admin-table-panel">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{dictionary.auditEvent}</th>
                    <th>{dictionary.auditActor}</th>
                    <th>{dictionary.auditTime}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code>platform.health.checked</code>
                    </td>
                    <td>{dictionary.auditSystem}</td>
                    <td>2026-08-17 09:12</td>
                  </tr>
                </tbody>
              </table>
            </section>
          ) : null}
        </>
      )}
    </ManagementShell>
  );
}
