"use client";

import {
  SystemModelPageSchema,
  SystemOverviewSchema,
  SystemTenantPageSchema,
  type SystemModel,
  type SystemOverview,
  type SystemTenant,
} from "@haloai/contracts";
import { Activity, Building2, Cpu, ShieldCheck } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HaloMetricCard } from "@/components/ui/halo-metric-card";
import { apiFetch } from "@/lib/api-client";
import type { SystemAdminDictionary } from "@/lib/system-admin-i18n";
import { SystemSectionState, SystemStatusBadge } from "./system-section-primitives";

export function SystemOverviewSection({ dictionary }: { dictionary: SystemAdminDictionary }) {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [tenants, setTenants] = useState<SystemTenant[]>([]);
  const [models, setModels] = useState<SystemModel[]>([]);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const [overviewPayload, tenantPayload, modelPayload] = await Promise.all([
        apiFetch<unknown>("/v1/system/overview"),
        apiFetch<unknown>("/v1/system/tenants?page=1&pageSize=3"),
        apiFetch<unknown>("/v1/system/models?page=1&pageSize=3"),
      ]);
      setOverview(SystemOverviewSchema.parse(overviewPayload));
      setTenants(SystemTenantPageSchema.parse(tenantPayload).items);
      setModels(SystemModelPageSchema.parse(modelPayload).items);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (failed) {
    return (
      <SystemSectionState
        kind="error"
        label={dictionary.loadError}
        retryLabel={dictionary.retry}
        onRetry={() => void load()}
      />
    );
  }
  if (!overview) return <SystemSectionState kind="loading" label={dictionary.loading} />;

  return (
    <div className="system-section-stack">
      <section className="admin-metrics system-metrics" aria-label={dictionary.overviewTitle}>
        <HaloMetricCard
          icon={<Building2 size={20} />}
          label={dictionary.totalTenants}
          value={String(overview.tenantTotal)}
          detail={dictionary.enabledDetail.replace("{count}", String(overview.activeTenantTotal))}
          tone="violet"
        />
        <HaloMetricCard
          icon={<ShieldCheck size={20} />}
          label={dictionary.activeTenants}
          value={String(overview.activeTenantTotal)}
          detail={dictionary.operatingNormally}
          tone="mint"
        />
        <HaloMetricCard
          icon={<Cpu size={20} />}
          label={dictionary.totalModels}
          value={String(overview.modelTotal)}
          detail={dictionary.enabledDetail.replace("{count}", String(overview.activeModelTotal))}
          tone="blue"
        />
        <HaloMetricCard
          icon={<Activity size={20} />}
          label={dictionary.activeModels}
          value={String(overview.activeModelTotal)}
          detail={dictionary.operatingNormally}
          tone="amber"
        />
      </section>

      <section className="system-overview-grid">
        <article className="system-preview-card" data-motion="admin-item">
          <header>
            <h2>
              <Building2 size={17} /> {dictionary.recentTenants}
            </h2>
            <Link href={"/system/tenants" as Route}>{dictionary.viewAll}</Link>
          </header>
          {tenants.length === 0 ? (
            <SystemSectionState kind="empty" label={dictionary.emptyTenants} />
          ) : (
            <div className="system-preview-list">
              {tenants.map((tenant) => (
                <div key={tenant.id}>
                  <span className="system-list-icon is-violet">
                    <Building2 size={16} />
                  </span>
                  <span>
                    <strong>{tenant.name}</strong>
                    <small>{tenant.slug}</small>
                  </span>
                  <SystemStatusBadge tone={tenant.status === "active" ? "success" : "warning"}>
                    {dictionary[tenant.status]}
                  </SystemStatusBadge>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="system-preview-card" data-motion="admin-item">
          <header>
            <h2>
              <Cpu size={17} /> {dictionary.recentModels}
            </h2>
            <Link href={"/system/models" as Route}>{dictionary.viewAll}</Link>
          </header>
          {models.length === 0 ? (
            <SystemSectionState kind="empty" label={dictionary.emptyModels} />
          ) : (
            <div className="system-preview-list">
              {models.map((model) => (
                <div key={model.id}>
                  <span className="system-list-icon is-blue">
                    <Cpu size={16} />
                  </span>
                  <span>
                    <strong>{model.name}</strong>
                    <small>{dictionary.formatLabels[model.apiFormat]}</small>
                  </span>
                  <SystemStatusBadge tone={model.status === "active" ? "success" : "muted"}>
                    {dictionary[model.status]}
                  </SystemStatusBadge>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="system-preview-card is-status" data-motion="admin-item">
          <header>
            <h2>
              <Activity size={17} /> {dictionary.serviceStatus}
            </h2>
          </header>
          <div className="system-service-hero">
            <span>
              <ShieldCheck size={24} />
            </span>
            <strong>{dictionary.operatingNormally}</strong>
            <SystemStatusBadge tone="success">{dictionary.apiReady}</SystemStatusBadge>
          </div>
        </article>
      </section>
    </div>
  );
}
