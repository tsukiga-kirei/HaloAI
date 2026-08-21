"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { animateBackdropIn, animateDrawerIn } from "@/lib/motion";

/**
 * 表单与创建流程使用右侧抽屉：顶栏、滚动区、可选固定底栏。
 * Radix 负责焦点与 Esc；GSAP 负责从右侧滑入。窄屏拉满宽度，仍从右侧进入。
 */
export function HaloDialog({
  open,
  title,
  description,
  icon,
  footer,
  size = "default",
  onClose,
  children,
  className,
  closeLabel = "关闭",
}: {
  open: boolean;
  title: string;
  description?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  size?: "default" | "wide";
  onClose: () => void;
  children: ReactNode;
  className?: string;
  closeLabel?: string;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    if (overlayRef.current) animateBackdropIn(overlayRef.current);
    if (contentRef.current) animateDrawerIn(contentRef.current);
  }, [open]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="halo-dialog-overlay" ref={overlayRef} />
        <Dialog.Content
          ref={contentRef}
          className={`halo-dialog-content${size === "wide" ? " is-wide" : ""}${
            footer ? " has-footer" : ""
          }${className ? ` ${className}` : ""}`}
          {...(description ? {} : { "aria-describedby": undefined })}
          onPointerDownOutside={(event) => {
            // 下拉/校验浮层通过 Portal 挂到 body，不能因此关闭抽屉。
            const target = event.target;
            if (
              target instanceof Element &&
              target.closest(".halo-select-content, .halo-field-error, .halo-menu-content")
            ) {
              event.preventDefault();
            }
          }}
          onFocusOutside={(event) => {
            const target = event.target;
            if (
              target instanceof Element &&
              target.closest(".halo-select-content, .halo-field-error, .halo-menu-content")
            ) {
              event.preventDefault();
            }
          }}
        >
          <div className="dialog-heading">
            <div className="dialog-heading-copy">
              {icon ? <span className="dialog-icon">{icon}</span> : null}
              <div>
                <Dialog.Title asChild>
                  <h2>{title}</h2>
                </Dialog.Title>
                {description ? (
                  <Dialog.Description asChild>
                    <p>{description}</p>
                  </Dialog.Description>
                ) : null}
              </div>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="icon-button" aria-label={closeLabel}>
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>
          <div className="halo-dialog-body">{children}</div>
          {footer ? <div className="halo-dialog-footer">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
