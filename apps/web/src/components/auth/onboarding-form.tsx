"use client";

import type { SessionContext, WorkspaceSummary } from "@haloai/contracts";
import { ArrowRight, LoaderCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { HaloMark } from "@/components/workspace/primitives";
import styles from "./auth-shell.module.css";

function toSlug(name: string): string {
  return name
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [userName, setUserName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<SessionContext>("/v1/session")
      .then((session) => {
        setUserName(session.user.name);
        if (session.workspaces.length > 0) router.replace("/app" as Route);
      })
      .catch((caught: unknown) => {
        if (caught instanceof ApiClientError && caught.status === 401)
          router.replace("/login" as Route);
        else setError("暂时无法读取账户信息，请刷新重试。");
      });
  }, [router]);

  function changeName(nextName: string): void {
    setName(nextName);
    if (!slugTouched) setSlug(toSlug(nextName));
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const result = await apiFetch<{ workspace: WorkspaceSummary }>("/v1/workspaces", {
        method: "POST",
        body: JSON.stringify({ name, slug, locale: "zh-CN", timeZone }),
      });
      window.localStorage.setItem("haloai.workspaceId", result.workspace.id);
      router.replace("/app" as Route);
      router.refresh();
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.code === "workspace_slug_conflict") {
        setError("这个工作区地址已被使用，请换一个更独特的标识。");
      } else {
        setError("工作区暂时无法创建，请检查信息后重试。");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.onboardingShell}>
      <aside className={styles.onboardingAside}>
        <div className={styles.brand}>
          <HaloMark />
          <strong>HaloAI</strong>
        </div>
        <h1>{userName ? `${userName}，建立团队工作区` : "建立团队工作区"}</h1>
        <p>工作区把成员、AI 角色、项目房间、文档与权限放在同一个清晰边界里。</p>
        <div className={styles.stepList} aria-label="设置进度">
          <div className={`${styles.step} ${styles.stepActive}`}>
            <strong>1</strong>
            <span>创建工作区</span>
          </div>
          <div className={styles.step}>
            <strong>2</strong>
            <span>邀请团队成员</span>
          </div>
          <div className={styles.step}>
            <strong>3</strong>
            <span>添加 AI 协作者</span>
          </div>
        </div>
      </aside>
      <section className={styles.onboardingMain}>
        <div className={styles.onboardingCard}>
          <h2>你的团队怎么称呼？</h2>
          <p>名称会显示在协作区；短地址只用于识别工作区。</p>
          <form className={styles.form} onSubmit={(event) => void submit(event)}>
            <label className={styles.field}>
              <span>工作区名称</span>
              <input
                value={name}
                onChange={(event) => changeName(event.target.value)}
                minLength={2}
                maxLength={80}
                required
                autoFocus
                placeholder="例如：北辰产品团队"
              />
            </label>
            <label className={styles.field}>
              <span>工作区短地址</span>
              <div className={styles.slugField}>
                <span>halo.ai/</span>
                <input
                  value={slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setSlug(toSlug(event.target.value));
                  }}
                  minLength={2}
                  maxLength={63}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  required
                  placeholder="beichen-team"
                />
              </div>
            </label>
            <p className={styles.hint}>仅使用小写字母、数字与连字符。</p>
            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
            <div className={styles.onboardingActions}>
              <button className={styles.submit} type="submit" disabled={submitting}>
                {submitting ? <LoaderCircle size={18} /> : <ArrowRight size={18} />}
                {submitting ? "正在创建…" : "创建工作区"}
              </button>
              <Link href={"/invite" as Route} className={styles.textLink}>
                我已经收到邀请
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
