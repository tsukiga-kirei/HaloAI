"use client";

import { Languages, LogOut, Moon, Sun, UserRoundCog } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Locale } from "@/lib/i18n";
import type { Theme } from "@/components/workspace/types";

/**
 * 语言、主题和角色切换只允许出现在账户菜单里，避免再做右侧工具栏或页面标题按钮。
 * 菜单用 fixed 定位，避免被侧栏 overflow 裁切。
 */
export function AccountMenu({
  open,
  name,
  detail,
  initials,
  locale,
  theme,
  labels,
  collapsed = false,
  onToggle,
  onClose,
  onToggleLocale,
  onToggleTheme,
  onSwitchRole,
  onSignOut,
}: {
  open: boolean;
  name: string;
  detail: string;
  initials: string;
  locale: Locale;
  theme: Theme;
  collapsed?: boolean;
  labels: {
    personalSettings: string;
    language: string;
    theme: string;
    lightTheme: string;
    darkTheme: string;
    switchRole: string;
    signOut: string;
  };
  onToggle: () => void;
  onClose: () => void;
  onToggleLocale: () => void;
  onToggleTheme: () => void;
  onSwitchRole: () => void;
  onSignOut?: (() => void) | undefined;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) onClose();
    }
    function handleKey(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, open]);

  return (
    <div className={`account-menu ${collapsed ? "is-collapsed" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="profile-button"
        aria-label={labels.personalSettings}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
      >
        <span className="account-avatar">{initials}</span>
        {collapsed ? null : (
          <span>
            <strong>{name}</strong>
            <small>{detail}</small>
          </span>
        )}
        {collapsed ? null : <UserRoundCog size={16} />}
      </button>
      {open ? (
        <div className="account-popover" role="menu">
          <p className="account-popover-identity">
            <strong>{name}</strong>
            <small>{detail}</small>
          </p>
          <button type="button" role="menuitem" onClick={onToggleLocale}>
            <Languages size={16} />
            {labels.language}
            <small>{locale === "zh-CN" ? "中" : "EN"}</small>
          </button>
          <button type="button" role="menuitem" onClick={onToggleTheme}>
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            {labels.theme}
            <small>{theme === "light" ? labels.lightTheme : labels.darkTheme}</small>
          </button>
          <button type="button" role="menuitem" onClick={onSwitchRole}>
            <UserRoundCog size={16} />
            {labels.switchRole}
          </button>
          {onSignOut ? (
            <button type="button" role="menuitem" className="is-danger" onClick={onSignOut}>
              <LogOut size={16} />
              {labels.signOut}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
