"use client";

import type { SessionContext, WorkspaceAnnouncement } from "@haloai/contracts";
import { AlertTriangle, Bell, Info, ShieldAlert, X } from "lucide-react";
import { useEffect, useState } from "react";
import { resolveActiveWorkspace } from "@/lib/active-workspace";
import { apiFetch } from "@/lib/api-client";
import { useShellPreferences } from "@/lib/shell-preferences";

/**
 * 空间广播横幅条：当空间管理员发布了 active 状态的公告时，在工作区顶部以统一视觉层展示。
 * 用户可点击右侧关闭按钮临时关闭当前通知。
 */
export function WorkspaceAnnouncementBanner() {
  const { locale } = useShellPreferences();
  const [announcements, setAnnouncements] = useState<WorkspaceAnnouncement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const session = await apiFetch<SessionContext>("/v1/session");
        const workspace = resolveActiveWorkspace(session);
        if (!workspace) return;
        const res = await apiFetch<{ items: WorkspaceAnnouncement[] }>(
          `/v1/workspaces/${workspace.id}/announcements`,
        );
        if (!cancelled) {
          const activeList = res.items.filter((a) => {
            if (!a.active) return false;
            if (a.expiresAt && new Date(a.expiresAt).getTime() < Date.now()) return false;
            return true;
          });
          setAnnouncements(activeList);
        }
      } catch {
        // 优雅降级
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleAnnouncements = announcements.filter((a) => !dismissedIds.has(a.id));
  if (visibleAnnouncements.length === 0) return null;

  const current = visibleAnnouncements[0];
  if (!current) return null;

  function getBannerStyle(lvl: "info" | "warning" | "critical") {
    if (lvl === "critical") {
      return {
        bg: "color-mix(in srgb, var(--danger, #ef4444) 10%, var(--surface-raised))",
        border: "color-mix(in srgb, var(--danger, #ef4444) 35%, var(--border))",
        text: "var(--danger, #ef4444)",
        icon: <ShieldAlert size={15} style={{ flexShrink: 0 }} />,
      };
    }
    if (lvl === "warning") {
      return {
        bg: "color-mix(in srgb, var(--warning, #f59e0b) 10%, var(--surface-raised))",
        border: "color-mix(in srgb, var(--warning, #f59e0b) 35%, var(--border))",
        text: "var(--warning, #d97706)",
        icon: <AlertTriangle size={15} style={{ flexShrink: 0 }} />,
      };
    }
    return {
      bg: "color-mix(in srgb, var(--accent) 8%, var(--surface-raised))",
      border: "var(--accent-border)",
      text: "var(--accent)",
      icon: <Info size={15} style={{ flexShrink: 0 }} />,
    };
  }

  const style = getBannerStyle(current.level);

  return (
    <aside
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "8px 16px",
        background: style.bg,
        borderBottom: `1px solid ${style.border}`,
        fontSize: "13px",
        color: "var(--text)",
        lineHeight: 1.4,
        zIndex: 50,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
        <span style={{ color: style.text }}>{style.icon}</span>
        <strong style={{ fontWeight: 650, color: "var(--text)", flexShrink: 0 }}>
          {current.title}:
        </strong>
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "var(--text-soft)",
          }}
        >
          {current.content}
        </span>
      </div>

      <button
        type="button"
        className="icon-button tiny"
        style={{ color: "var(--text-muted)" }}
        aria-label={locale === "zh-CN" ? "关闭公告" : "Dismiss announcement"}
        onClick={() => setDismissedIds((prev) => new Set([...prev, current.id]))}
      >
        <X size={14} />
      </button>
    </aside>
  );
}
