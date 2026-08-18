"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n";
import { readStoredPortal, type PortalKey } from "@/lib/portals";
import { SIDEBAR_COLLAPSED_KEY } from "@/lib/shell-collapsed";

type Theme = "light" | "dark";

export interface ShellPreferences {
  locale: Locale;
  setLocale: (locale: Locale | ((current: Locale) => Locale)) => void;
  theme: Theme;
  setTheme: (theme: Theme | ((current: Theme) => Theme)) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean | ((current: boolean) => boolean)) => void;
  portal: PortalKey;
  sidebarMotion: boolean;
}

const ShellPreferencesContext = createContext<ShellPreferences | null>(null);

function writeCollapsedCookie(collapsed: boolean): void {
  document.cookie = `${SIDEBAR_COLLAPSED_KEY}=${collapsed ? "true" : "false"}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function useCreateShellPreferences(initialCollapsed: boolean): ShellPreferences {
  const [locale, setLocale] = useState<Locale>("zh-CN");
  const [theme, setTheme] = useState<Theme>("light");
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [portal, setPortal] = useState<PortalKey>("member");
  const [ready, setReady] = useState(false);
  const [sidebarMotion, setSidebarMotion] = useState(false);

  useLayoutEffect(() => {
    const savedLocale = window.localStorage.getItem("haloai.locale");
    const savedTheme = window.localStorage.getItem("haloai.theme");
    const savedCollapsed = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (savedLocale === "zh-CN" || savedLocale === "en-US") setLocale(savedLocale);
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
    setCollapsed(savedCollapsed === "true");
    setPortal(readStoredPortal());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    setSidebarMotion(true);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("haloai.locale", locale);
    window.localStorage.setItem("haloai.theme", theme);
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "true" : "false");
    writeCollapsedCookie(collapsed);
  }, [collapsed, locale, ready, theme]);

  return useMemo(
    () => ({
      locale,
      setLocale,
      theme,
      setTheme,
      collapsed,
      setCollapsed,
      portal,
      sidebarMotion,
    }),
    [collapsed, locale, portal, sidebarMotion, theme],
  );
}

/**
 * 折叠、语言和主题必须由布局层的一份状态供给。分区页若各自 useState，
 * 账户菜单切换语言后画布文案不会更新，收起侧栏换页也会各画各的宽度。
 */
export function ShellStateBridge({
  initialCollapsed,
  children,
}: {
  initialCollapsed: boolean;
  children: ReactNode;
}) {
  const value = useCreateShellPreferences(initialCollapsed);
  return (
    <ShellPreferencesContext.Provider value={value}>{children}</ShellPreferencesContext.Provider>
  );
}

export function useShellPreferences(): ShellPreferences {
  const context = useContext(ShellPreferencesContext);
  if (!context) {
    throw new Error("useShellPreferences 必须放在 ShellStateBridge 内");
  }
  return context;
}

export { SIDEBAR_COLLAPSED_KEY };
