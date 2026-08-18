"use client";

import { Activity, Database, Server } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, getApiBaseUrl } from "@/lib/api-client";
import { useSystemAdminDictionary } from "@/lib/use-system-admin-dictionary";
import { SystemSectionState, SystemStatusBadge } from "./system-section-primitives";

export function SystemHealthSection() {
  const { dictionary } = useSystemAdminDictionary();
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [directoryReady, setDirectoryReady] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setApiReady(null);
    setDirectoryReady(null);
    const [health, directory] = await Promise.allSettled([
      fetch(`${getApiBaseUrl()}/health/ready`, { credentials: "include" }),
      apiFetch<unknown>("/v1/system/overview"),
    ]);
    setApiReady(health.status === "fulfilled" && health.value.ok);
    setDirectoryReady(directory.status === "fulfilled");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (apiReady === null || directoryReady === null) {
    return <SystemSectionState kind="loading" label={dictionary.loading} />;
  }

  const services = [
    { icon: Server, label: dictionary.apiService, ready: apiReady },
    { icon: Database, label: dictionary.platformDirectory, ready: directoryReady },
  ] as const;

  return (
    <div className="system-health-grid">
      {services.map((service) => {
        const Icon = service.icon;
        return (
          <article className="system-health-card" key={service.label} data-motion="admin-item">
            <span className={service.ready ? "is-ready" : "is-down"}>
              <Icon size={20} />
            </span>
            <div>
              <small>{dictionary.serviceStatus}</small>
              <h2>{service.label}</h2>
              <p>{service.ready ? dictionary.operatingNormally : dictionary.unavailable}</p>
            </div>
            <SystemStatusBadge tone={service.ready ? "success" : "warning"}>
              <Activity size={12} />
              {service.ready ? dictionary.apiReady : dictionary.apiUnavailable}
            </SystemStatusBadge>
          </article>
        );
      })}
    </div>
  );
}
