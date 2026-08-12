"use client";

import type { SessionContext, WorkspaceSummary } from "@haloai/contracts";
import { LoaderCircle, RefreshCw } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, ApiClientError, getApiBaseUrl } from "@/lib/api-client";
import { HaloWorkspace } from "@/components/halo-workspace";
import styles from "./auth-shell.module.css";

const demoMode = process.env.NEXT_PUBLIC_AUTH_MODE === "demo";

export function SessionGate() {
  const router = useRouter();
  const [session, setSession] = useState<SessionContext | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceSummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (demoMode) return;
    let active = true;
    apiFetch<SessionContext>("/v1/session")
      .then((nextSession) => {
        if (!active) return;
        if (nextSession.workspaces.length === 0) {
          router.replace("/onboarding" as Route);
          return;
        }
        const remembered = window.localStorage.getItem("haloai.workspaceId");
        const selected =
          nextSession.workspaces.find((workspace) => workspace.id === remembered) ??
          nextSession.workspaces[0] ??
          null;
        setSession(nextSession);
        setActiveWorkspace(selected);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiClientError && error.status === 401) {
          router.replace("/login" as Route);
          return;
        }
        setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (demoMode) return <HaloWorkspace />;

  if (failed) {
    return (
      <main className={styles.statusPage}>
        <div className={styles.statusCard}>
          <span className={styles.statusIcon}>
            <RefreshCw size={22} />
          </span>
          <h1>暂时无法连接协作服务</h1>
          <p>请确认本地 API 与数据库已经启动，然后重新加载页面。</p>
          <button type="button" onClick={() => window.location.reload()}>
            重新连接
          </button>
        </div>
      </main>
    );
  }

  if (!session || !activeWorkspace) {
    return (
      <main className={styles.statusPage} aria-label="正在进入工作区">
        <div className={styles.loadingMark}>
          <LoaderCircle size={22} />
          <span>正在准备你的协作空间…</span>
        </div>
      </main>
    );
  }

  function switchWorkspace(workspace: WorkspaceSummary): void {
    window.localStorage.setItem("haloai.workspaceId", workspace.id);
    setActiveWorkspace(workspace);
  }

  async function signOut(): Promise<void> {
    await fetch(`${getApiBaseUrl()}/api/auth/sign-out`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    window.localStorage.removeItem("haloai.workspaceId");
    router.replace("/login" as Route);
    router.refresh();
  }

  return (
    <HaloWorkspace
      identity={session.user}
      workspaces={session.workspaces}
      activeWorkspace={activeWorkspace}
      onWorkspaceChange={switchWorkspace}
      onSignOut={() => void signOut()}
    />
  );
}
