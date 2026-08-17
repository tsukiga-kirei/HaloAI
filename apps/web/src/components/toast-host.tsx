"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { Toaster, toast } from "sonner";

const CENTRAL_ALERT_TOASTER_ID = "haloai-central-alert";

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
    <>
      <Toaster
        theme={theme}
        position="top-center"
        offset={24}
        duration={3600}
        closeButton
        visibleToasts={3}
        style={{ "--width": "min(420px, calc(100vw - 32px))" } as CSSProperties}
      />
      <Toaster
        id={CENTRAL_ALERT_TOASTER_ID}
        className="halo-central-toaster"
        theme={theme}
        position="top-center"
        offset={24}
        duration={3600}
        closeButton
        visibleToasts={1}
        style={
          {
            right: "auto",
            left: "50%",
            width: 0,
            transform: "none",
            "--width": "min(420px, calc(100vw - 32px))",
          } as CSSProperties
        }
      />
    </>
  );
}

export function notify(message: string): void {
  toast.info(message);
}

export function notifyError(message: string, id = "haloai-error"): void {
  // 全局失败只保留一条顶部居中提醒，避免重复提交时提示堆叠并遮挡登录表单。
  toast.error(message, { id, toasterId: CENTRAL_ALERT_TOASTER_ID });
}
