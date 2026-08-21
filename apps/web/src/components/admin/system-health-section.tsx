"use client";

import type { SystemDetailedHealth } from "@haloai/contracts";
import { Activity, Cpu, Database, HardDrive, RefreshCw, Server, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/api-client";
import { useSystemAdminDictionary } from "@/lib/use-system-admin-dictionary";
import { SystemSectionState, SystemStatusBadge } from "./system-section-primitives";

export function SystemHealthSection() {
  const { dictionary } = useSystemAdminDictionary();
  const [detailed, setDetailed] = useState<SystemDetailedHealth | null>(null);
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, detailedRes] = await Promise.allSettled([
        fetch(`${getApiBaseUrl()}/health/ready`, { credentials: "include" }),
        apiFetch<SystemDetailedHealth>("/v1/system/health/detailed"),
      ]);

      setApiReady(healthRes.status === "fulfilled" && healthRes.value.ok);
      if (detailedRes.status === "fulfilled") {
        setDetailed(detailedRes.value);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !detailed) {
    return <SystemSectionState kind="loading" label={dictionary.loading} />;
  }

  const items = [
    {
      icon: Server,
      title: dictionary.apiService,
      status: apiReady ? "healthy" : "unhealthy",
      statusLabel: apiReady ? dictionary.healthy : dictionary.unhealthy,
      detail: apiReady ? dictionary.operatingNormally : dictionary.unavailable,
      metrics: null,
    },
    {
      icon: Database,
      title: dictionary.databaseStatus,
      status: detailed?.database.status ?? "healthy",
      statusLabel:
        detailed?.database.status === "healthy"
          ? dictionary.healthy
          : detailed?.database.status === "degraded"
            ? dictionary.degraded
            : dictionary.unhealthy,
      detail: `${dictionary.dbLatency}: ${detailed?.database.latencyMs ?? 0}ms`,
      metrics: detailed?.database.connectionPool
        ? `${dictionary.connectionPool}: ${detailed.database.connectionPool.active} 活跃 / ${detailed.database.connectionPool.idle} 空闲 (共 ${detailed.database.connectionPool.total})`
        : null,
    },
    {
      icon: Zap,
      title: dictionary.redisStatus,
      status: detailed?.redis.status ?? "healthy",
      statusLabel: detailed?.redis.status === "healthy" ? dictionary.healthy : dictionary.unhealthy,
      detail: `${dictionary.redisLatency}: ${detailed?.redis.latencyMs ?? 1}ms`,
      metrics: null,
    },
    {
      icon: Cpu,
      title: dictionary.workerStatus,
      status: detailed?.worker.status ?? "healthy",
      statusLabel:
        detailed?.worker.status === "healthy" ? dictionary.healthy : dictionary.unhealthy,
      detail: `${dictionary.activeJobs}: ${detailed?.worker.activeJobs ?? 0}`,
      metrics: null,
    },
    {
      icon: HardDrive,
      title: dictionary.storageStatus,
      status: detailed?.storage.status ?? "healthy",
      statusLabel:
        detailed?.storage.status === "healthy" ? dictionary.healthy : dictionary.unhealthy,
      detail: `${dictionary.storageWritable}: ${detailed?.storage.writable ? "正常可写" : "只读/不可写"}`,
      metrics: null,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>{dictionary.detailedHealthTitle}</h2>
        <button
          type="button"
          className="admin-secondary-button compact"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {dictionary.retry}
        </button>
      </div>

      <div className="system-health-grid">
        {items.map((item) => {
          const Icon = item.icon;
          const tone =
            item.status === "healthy"
              ? "success"
              : item.status === "degraded"
                ? "warning"
                : "muted";
          return (
            <article className="system-health-card" key={item.title} data-motion="admin-item">
              <span className={item.status === "healthy" ? "is-ready" : "is-down"}>
                <Icon size={20} />
              </span>
              <div>
                <small>{dictionary.serviceStatus}</small>
                <h2>{item.title}</h2>
                <p>{item.detail}</p>
                {item.metrics ? (
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--halo-text-muted)",
                      marginTop: "0.25rem",
                    }}
                  >
                    {item.metrics}
                  </p>
                ) : null}
              </div>
              <SystemStatusBadge tone={tone}>
                <Activity size={12} />
                {item.statusLabel}
              </SystemStatusBadge>
            </article>
          );
        })}
      </div>
    </div>
  );
}
