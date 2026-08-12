"use client";

import type { SessionContext, WorkspaceSummary } from "@haloai/contracts";
import { ArrowRight, Check, KeyRound, LoaderCircle } from "lucide-react";
import type { Route } from "next";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import styles from "./auth-shell.module.css";

export function InvitationAcceptance() {
  const router = useRouter();
  const params = useParams<{ token?: string }>();
  const token = params.token;
  const [state, setState] = useState<"checking" | "ready" | "accepting" | "done" | "error">(
    "checking",
  );
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setState("error");
      return;
    }
    apiFetch<SessionContext>("/v1/session")
      .then((session) => {
        setUser(session.user);
        setState("ready");
      })
      .catch((caught: unknown) => {
        if (caught instanceof ApiClientError && caught.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(`/invite/${token}`)}` as Route);
        } else setState("error");
      });
  }, [router, token]);

  async function accept(): Promise<void> {
    if (!token) return;
    setState("accepting");
    try {
      const result = await apiFetch<{ workspace: WorkspaceSummary }>("/v1/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      window.localStorage.setItem("haloai.workspaceId", result.workspace.id);
      setState("done");
      window.setTimeout(() => {
        router.replace("/app" as Route);
        router.refresh();
      }, 700);
    } catch {
      setState("error");
    }
  }

  return (
    <main className={styles.statusPage}>
      <section className={styles.statusCard}>
        <span className={styles.statusIcon}>
          {state === "done" ? (
            <Check size={23} />
          ) : state === "checking" ? (
            <LoaderCircle size={23} />
          ) : (
            <KeyRound size={23} />
          )}
        </span>
        <h1>{state === "done" ? "已加入工作区" : "加入团队协作空间"}</h1>
        {state === "checking" ? (
          <p>正在确认你的账户…</p>
        ) : state === "error" ? (
          <p>这份邀请不存在、已过期，或与当前登录邮箱不匹配。</p>
        ) : (
          <p>{user ? `${user.name}（${user.email}）` : "当前账户"} 将以邀请中指定的角色加入。</p>
        )}
        {state === "ready" ? (
          <button type="button" className={styles.primaryButton} onClick={() => void accept()}>
            接受邀请 <ArrowRight size={16} />
          </button>
        ) : null}
        {state === "accepting" ? (
          <div className={styles.loadingMark}>
            <LoaderCircle size={19} /> 正在加入…
          </div>
        ) : null}
        {state === "error" ? (
          <button type="button" onClick={() => router.replace("/app" as Route)}>
            返回工作区
          </button>
        ) : null}
      </section>
    </main>
  );
}
