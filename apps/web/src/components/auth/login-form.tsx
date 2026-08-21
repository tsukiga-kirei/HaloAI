"use client";

import type { SessionContext, WorkspaceSummary } from "@haloai/contracts";
import {
  Building2,
  Eye,
  EyeOff,
  Languages,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Settings2,
  Shield,
  ShieldCheck,
} from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { notifyError } from "@/components/toast-host";
import { HaloMark } from "@/components/workspace/primitives";
import {
  persistPortal,
  persistWorkspaceId,
  portalPath,
  readStoredWorkspaceId,
  type PortalKey,
} from "@/lib/portals";
import { apiFetch, ApiClientError, getApiBaseUrl } from "@/lib/api-client";
import { FieldError } from "@/components/ui/field-error";
import { HaloSegmented } from "@/components/ui/halo-segmented";
import { HaloSelect } from "@/components/ui/halo-select";
import { authCopy, type AuthLocale } from "./auth-copy";
import { animateLoginEntrance, animatePortalDescription } from "@/lib/motion";
import styles from "./auth-shell.module.css";

const fallbackPortal = {
  key: "member" as const,
  icon: LayoutDashboard,
  label: "portalMember" as const,
  description: "portalMemberDesc" as const,
};
const portals = [
  fallbackPortal,
  {
    key: "workspace_admin" as const,
    icon: Settings2,
    label: "portalWorkspace" as const,
    description: "portalWorkspaceDesc" as const,
  },
  {
    key: "system_admin" as const,
    icon: Shield,
    label: "portalSystem" as const,
    description: "portalSystemDesc" as const,
  },
];

function looksLikeEmail(value: string): boolean {
  // 登录页禁止浏览器原生气泡，邮箱格式只在提交时由产品浮层提示。
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function preferredWorkspaceId(workspaces: readonly WorkspaceSummary[]): string | null {
  const remembered = readStoredWorkspaceId();
  return (
    workspaces.find((workspace) => workspace.id === remembered)?.id ?? workspaces[0]?.id ?? null
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState<AuthLocale>("zh-CN");
  const [portal, setPortal] = useState<PortalKey>("member");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<"email" | "password" | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const shellRef = useRef<HTMLElement>(null);
  const portalDescriptionRef = useRef<HTMLParagraphElement>(null);
  const copy = authCopy[locale];
  const activePortal = portals.find((item) => item.key === portal) ?? fallbackPortal;
  const ActiveIcon = activePortal.icon;
  const selectedWorkspace =
    workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null;
  // 系统管理不绑定具体工作区；协作成员和空间管理在账号密码下方选择工作区。
  const needsWorkspace = portal !== "system_admin";

  const portalReady = useRef(false);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    return animateLoginEntrance(shell);
  }, []);

  useLayoutEffect(() => {
    const description = portalDescriptionRef.current;
    if (!description) return;
    if (!portalReady.current) {
      portalReady.current = true;
      return;
    }
    return animatePortalDescription(description);
  }, [portal]);

  useEffect(() => {
    const saved = window.localStorage.getItem("haloai.locale");
    if (saved === "zh-CN" || saved === "en-US") setLocale(saved);
  }, []);

  useEffect(() => {
    setFieldError(null);
  }, [portal]);

  useEffect(() => {
    if (workspaces.length === 0) {
      setSelectedWorkspaceId(null);
      return;
    }
    setSelectedWorkspaceId((current) =>
      current !== null && workspaces.some((workspace) => workspace.id === current)
        ? current
        : preferredWorkspaceId(workspaces),
    );
  }, [workspaces]);

  function enterWorkspace(): void {
    persistPortal(portal);
    const requestedNext = searchParams.get("next");
    const safeNext =
      requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : portalPath(portal);
    router.replace(safeNext as Route);
    router.refresh();
  }

  function applySession(session: SessionContext): void {
    // 登录页不在刷新时复用 Cookie 会话；只有本页提交邮箱密码成功后才填工作区，并默认选中第一个。
    setHasSession(true);
    setWorkspaces(session.workspaces);
    setSelectedWorkspaceId(preferredWorkspaceId(session.workspaces));
  }

  function continueAfterSession(
    nextWorkspaces = workspaces,
    nextSelectedId = selectedWorkspaceId,
  ): void {
    const requestedNext = searchParams.get("next");
    // 邮箱绑定的一次性邀请本身就是后续工作空间上下文。受邀人可能尚未加入任何空间，
    // 登录成功后必须先回到邀请页，不能错误地被普通零空间逻辑送去初始化向导。
    if (requestedNext?.startsWith("/invite/") || requestedNext?.startsWith("/tenant-activate/")) {
      enterWorkspace();
      return;
    }
    if (portal !== "system_admin") {
      if (nextWorkspaces.length === 0) {
        router.replace("/onboarding" as Route);
        return;
      }
      if (nextSelectedId === null) return;
      // 本地保存的 workspaceId 只是界面偏好，授权仍由服务端 Membership 强制执行。
      persistWorkspaceId(nextSelectedId);
    } else if (nextSelectedId) {
      persistWorkspaceId(nextSelectedId);
    }
    enterWorkspace();
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (hasSession) {
      continueAfterSession();
      return;
    }
    setSubmitting(true);
    setFieldError(null);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (email.length === 0 || !looksLikeEmail(email)) {
      setFieldError("email");
      setSubmitting(false);
      return;
    }
    if (password.length < 10) {
      setFieldError("password");
      setSubmitting(false);
      return;
    }
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/sign-in/email`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        notifyError(copy.invalid, "login-error");
        return;
      }
      const session = await apiFetch<SessionContext>("/v1/session");
      applySession(session);
      if (portal === "system_admin") {
        await apiFetch<{ allowed: true }>("/v1/system/access");
        continueAfterSession(session.workspaces, preferredWorkspaceId(session.workspaces));
      }
    } catch (caught) {
      if (caught instanceof ApiClientError && caught.status === 403) setHasSession(false);
      notifyError(
        caught instanceof ApiClientError
          ? caught.status === 403
            ? copy.systemAccessDenied
            : caught.status === 401
              ? copy.sessionUnreadable
              : copy.generic
          : copy.generic,
        "login-error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const submitLabel = submitting
    ? copy.working
    : hasSession && needsWorkspace
      ? selectedWorkspace
        ? copy.enterWorkspace.replace("{workspace}", selectedWorkspace.name)
        : copy.createFirstWorkspace
      : copy.submitAs.replace("{role}", copy[activePortal.label]);

  return (
    <main className={styles.authShell} ref={shellRef}>
      <div className={styles.authFrame}>
        <section className={styles.storyPanel} aria-label={copy.eyebrow}>
          <div className={styles.storyInner}>
            <div className={styles.brand} data-motion="login-brand">
              <HaloMark size="brand" />
              <strong>HaloAI</strong>
            </div>
            <div className={styles.storyCopy} data-motion="login-story">
              <span className={styles.eyebrow}>{copy.eyebrow}</span>
              <h1>{copy.title}</h1>
              <p>{copy.description}</p>
              <ul className={styles.benefits}>
                {copy.benefits.map((benefit) => (
                  <li key={benefit}>
                    <span className={styles.benefitIcon}>
                      <ShieldCheck size={16} />
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <small className={styles.storyFooter}>HaloAI · Teams and AI, working as one</small>
          </div>
        </section>

        <section className={styles.formPanel}>
          <button
            type="button"
            className={styles.languageButton}
            onClick={() => {
              const next = locale === "zh-CN" ? "en-US" : "zh-CN";
              setLocale(next);
              window.localStorage.setItem("haloai.locale", next);
              document.documentElement.lang = next;
            }}
          >
            <Languages size={16} /> {copy.language}
          </button>
          <div className={styles.formCard} data-portal={portal} data-motion="login-panel">
            <h2>{copy.welcome}</h2>
            <p className={styles.formLead}>{copy.welcomeDetail}</p>
            <div data-motion="login-control">
              <HaloSegmented
                fill
                ariaLabel={copy.selectIdentity}
                value={portal}
                items={portals.map((item) => ({
                  value: item.key,
                  label: copy[item.label],
                  icon: item.icon,
                }))}
                onChange={(next) => {
                  setPortal(next);
                }}
              />
            </div>
            <p className={styles.portalDesc} ref={portalDescriptionRef}>
              <span className={`${styles.portalDot} ${styles[`dot-${portal}`]}`} />
              {copy[activePortal.description]}
            </p>
            <form className={styles.form} noValidate onSubmit={(event) => void submit(event)}>
              <label className={styles.field} data-motion="login-control">
                <span>{copy.email}</span>
                <FieldError inline open={fieldError === "email"} message={copy.emailInvalid}>
                  <div className={styles.inputWrap}>
                    <Mail size={16} />
                    <input
                      name="email"
                      type="text"
                      inputMode="email"
                      autoComplete="email"
                      maxLength={320}
                      placeholder={copy.emailPlaceholder}
                      onChange={() => setFieldError(null)}
                    />
                  </div>
                </FieldError>
              </label>
              <label className={styles.field} data-motion="login-control">
                <span>{copy.password}</span>
                <FieldError inline open={fieldError === "password"} message={copy.passwordRequired}>
                  <div className={styles.inputWrap}>
                    <LockKeyhole size={16} />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      maxLength={128}
                      placeholder={copy.passwordPlaceholder}
                      onChange={() => setFieldError(null)}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FieldError>
              </label>
              {needsWorkspace ? (
                <div className={styles.field} data-motion="login-control">
                  <span>{copy.selectWorkspace}</span>
                  <HaloSelect
                    value={selectedWorkspaceId ?? ""}
                    onValueChange={(next) => setSelectedWorkspaceId(next)}
                    ariaLabel={copy.selectWorkspace}
                    placeholder={
                      hasSession && workspaces.length === 0
                        ? copy.emptyWorkspaceList
                        : copy.workspacePending
                    }
                    prefix={<Building2 size={16} />}
                    disabled={!hasSession || workspaces.length === 0}
                    options={workspaces.map((workspace) => ({
                      value: workspace.id,
                      label: workspace.name,
                    }))}
                  />
                  {!hasSession ? (
                    <small className={styles.fieldHint}>{copy.workspacePendingHint}</small>
                  ) : null}
                </div>
              ) : null}
              <button
                type="submit"
                className={styles.submit}
                data-motion="login-control"
                disabled={
                  submitting ||
                  (needsWorkspace &&
                    hasSession &&
                    workspaces.length > 0 &&
                    selectedWorkspaceId === null)
                }
              >
                {submitting ? (
                  <LoaderCircle size={18} className={styles.loadingMark} />
                ) : (
                  <ActiveIcon size={18} />
                )}
                {submitLabel}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
