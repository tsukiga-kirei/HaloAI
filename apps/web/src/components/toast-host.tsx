"use client";

import { Toaster, toast } from "sonner";

/** 所有提示统一走中央 Toast，禁止再做贴边或页面内常驻横幅。 */
export function ToastHost() {
  return (
    <Toaster
      position="top-center"
      offset={24}
      duration={2800}
      closeButton
      toastOptions={{
        className: "halo-toast",
      }}
    />
  );
}

export function notify(message: string): void {
  toast(message);
}
