"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { Toaster, toast } from "sonner";

function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function readTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

/**
 * 提示使用开源库 Sonner 的默认信息布局与动效。
 * 只通过 CSS 变量接入 Halo token，不得改成自制白盒。
 */
export function ToastHost() {
  const theme = useSyncExternalStore<"light" | "dark">(subscribeTheme, readTheme, () => "light");

  return (
    <Toaster
      theme={theme}
      position="top-center"
      offset={24}
      duration={3600}
      closeButton
      visibleToasts={3}
      style={{ "--width": "max-content" } as CSSProperties}
    />
  );
}

export function notify(message: string): void {
  toast.info(message);
}
