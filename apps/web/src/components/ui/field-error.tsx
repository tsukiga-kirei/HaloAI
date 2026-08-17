"use client";

import { CircleAlert } from "lucide-react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { animateOverlayIn } from "@/lib/motion";

/**
 * 字段错误必须是贴着输入框的弹出层，不能插入表单文档流把后面的字段顶下去。
 */
export function FieldError({
  open,
  message,
  children,
}: {
  open: boolean;
  message: string;
  children: ReactNode;
}) {
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (open && popupRef.current) animateOverlayIn(popupRef.current);
  }, [open]);

  return (
    <div className="halo-field-anchor">
      {children}
      {open ? (
        <div ref={popupRef} className="halo-field-error" role="alert">
          <span className="halo-field-error-caret" aria-hidden="true" />
          <CircleAlert size={16} />
          <span>{message}</span>
        </div>
      ) : null}
    </div>
  );
}
