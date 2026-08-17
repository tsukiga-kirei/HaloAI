"use client";

import { CircleAlert } from "lucide-react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { animateOverlayIn } from "@/lib/motion";

/**
 * 默认错误提示贴着字段浮出，适合空间稳定的管理表单；登录等窄视口表单使用 inline，
 * 让提示进入文档流，避免覆盖下一字段或在短视口中被滚动容器裁切。
 */
export function FieldError({
  open,
  message,
  children,
  inline = false,
}: {
  open: boolean;
  message: string;
  children: ReactNode;
  inline?: boolean;
}) {
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (open && popupRef.current) animateOverlayIn(popupRef.current);
  }, [open]);

  return (
    <div className="halo-field-anchor">
      {children}
      {open ? (
        <div
          ref={popupRef}
          className={`halo-field-error${inline ? " is-inline" : ""}`}
          role="alert"
        >
          <span className="halo-field-error-caret" aria-hidden="true" />
          <CircleAlert size={16} />
          <span>{message}</span>
        </div>
      ) : null}
    </div>
  );
}
