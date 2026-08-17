"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { readStoredPortal, type PortalKey } from "@/lib/portals";

type Theme = "light" | "dark";

export const SIDEBAR_COLLAPSED_KEY = "haloai.sidebarCollapsed";

/**
 * 协作、空间管理、系统管理各自挂载外壳，折叠偏好写在 localStorage。
 * 必须在首次绘制前恢复宽度，且先不要打开 CSS 过渡；否则换门户会被当成一次收起动画。
 */
export function useShellPreferences() {
  const [locale, setLocale] = useState<Locale>("zh-CN");
  const [theme, setTheme] = useState<Theme>("light");
  const [collapsed, setCollapsed] = useState(false);
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
  }, [collapsed, locale, ready, theme]);

  return {
    locale,
    setLocale,
    theme,
    setTheme,
    collapsed,
    setCollapsed,
    portal,
    sidebarMotion,
  };
}
