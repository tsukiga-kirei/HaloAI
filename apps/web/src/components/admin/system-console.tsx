"use client";

import {
  Activity,
  Building2,
  CircleAlert,
  Cpu,
  LayoutDashboard,
  Plus,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { ManagementShell } from "./management-shell";
import { SystemModelsSection } from "./system-models-section";
import { HaloMetricCard } from "@/components/ui/halo-metric-card";
import { notify } from "@/components/toast-host";
import { getApiBaseUrl } from "@/lib/api-client";
import type { AdminDictionary } from "@/lib/admin-i18n";
import { type SystemSection } from "@/lib/system-sections";

const navigation = [
  { section: "overview", href: "/system" as Route, icon: LayoutDashboard, labelKey: "navOverview" },
  { section: "tenants", href: "/system/tenants" as Route, icon: Building2, labelKey: "navTenants" },
  { section: "models", href: "/system/models" as Route, icon: Cpu, labelKey: "navModels" },
  { section: "health", href: "/system/health" as Route, icon: Activity, labelKey: "navHealth" },
  { section: "policy", href: "/system/policy" as Route, icon: ShieldCheck, labelKey: "navPolicy" },
  { section: "audit", href: "/system/audit" as Route, icon: ScrollText, labelKey: "navAudit" },
] as const;

function titleFrom(section: SystemSection, dictionary: AdminDictionary): string {
  if (section === "tenants") return dictionary.systemTenantsTitle;
  if (section === "models") return dictionary.systemModelsTitle;
  if (section === "health") return dictionary.systemHealthTitle;
  if (section === "policy") return dictionary.systemPolicyTitle;
  if (section === "audit") return dictionary.auditTitle;
  return dictionary.systemOverviewTitle;
}

function healthLabel(apiReady: boolean | null, dictionary: AdminDictionary): string {
  if (apiReady === null) return "…";
  return apiReady ? dictionary.apiReady : dictionary.apiUnavailable;
}

/**
 * 系统管理不展示租户房间或文档内容。没有平台目录 API 时保持空态，
 * 健康检查只探测 API 就绪接口，不得把未接入的依赖显示为可用。
 */
export function SystemConsole({ section }: { section: SystemSection }) {
  const [apiReady, setApiReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${getApiBaseUrl()}/health/ready`, { credentials: "include" })
      .then((response) => {
        if (!cancelled) setApiReady(response.ok);
      })
      .catch(() => {
        if (!cancelled) setApiReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      {(dictionary) => (
        <>
          <div className="admin-section-heading">
            <div>
              <h1>{titleFrom(section, dictionary)}</h1>
              {section === "models" ? <p>{dictionary.systemModelsIntro}</p> : null}
            </div>
            {section === "models" ? (
              <button
                type="button"
                className="admin-primary-button"
                onClick={() => notify(dictionary.localOnlyNotice)}
              >
                <Plus size={17} />
                {dictionary.registerModel}
              </button>
            ) : null}
          </div>
          {section === "overview" ? (
            <section className="admin-metrics" aria-label={dictionary.systemOverviewTitle}>
              <HaloMetricCard
                icon={<Building2 size={20} />}
                label={dictionary.navTenants}
                value="0"
                detail={dictionary.metricUnavailable}
                tone="violet"
              />
              <HaloMetricCard
                icon={<Cpu size={20} />}
                label={dictionary.navModels}
                value="0"
                detail={dictionary.metricUnavailable}
                tone="blue"
              />
              <HaloMetricCard
                icon={<Activity size={20} />}
                label={dictionary.navHealth}
                value={healthLabel(apiReady, dictionary)}
                detail={dictionary.availableNow}
                tone="mint"
              />
              <HaloMetricCard
                icon={<CircleAlert size={20} />}
                label={dictionary.pendingApprovals}
                value="0"
                detail={dictionary.metricUnavailable}
                tone="amber"
              />
            </section>
          ) : null}
          {section === "tenants" || section === "overview" ? (
            <p className="document-empty-copy">{dictionary.emptyTenantDirectory}</p>
          ) : null}
          {section === "models" ? <SystemModelsSection dictionary={dictionary} /> : null}
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
                    <td>{healthLabel(apiReady, dictionary)}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          ) : null}
          {section === "policy" ? (
            <section className="admin-security-grid is-two">
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
            <p className="document-empty-copy">{dictionary.emptyAuditLog}</p>
          ) : null}
        </>
      )}
    </ManagementShell>
  );
}
