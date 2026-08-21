"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { useShellPreferences } from "@/lib/shell-preferences";

/**
 * 确认弹窗、危险操作警告与聚焦操作使用居中 Modal 对话框。
 * 区别于右侧抽屉（HaloDialog），HaloModal 居中展示、带有磨砂毛玻璃遮罩、圆角与弹性动画。
 */
export function HaloModal({
  open,
  title,
  description,
  icon,
  footer,
  danger,
  onClose,
  children,
  className,
  closeLabel,
}: {
  open: boolean;
  title: string;
  description?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  danger?: boolean;
  onClose: () => void;
  children?: ReactNode;
  className?: string;
  closeLabel?: string;
}) {
  const { locale } = useShellPreferences();
  const effectiveCloseLabel = closeLabel ?? (locale === "zh-CN" ? "关闭" : "Close");
  const [present, setPresent] = useState(open);

  const frameRef = useRef({
    title,
    description,
    icon,
    footer,
    danger,
    children,
    className,
    closeLabel: effectiveCloseLabel,
  });

  if (open) {
    frameRef.current = {
      title,
      description,
      icon,
      footer,
      danger,
      children,
      className,
      closeLabel: effectiveCloseLabel,
    };
  }

  const frame = frameRef.current;

  useLayoutEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }
    if (!present) return;
    const timer = window.setTimeout(() => setPresent(false), prefersReducedMotion() ? 0 : 150);
    return () => window.clearTimeout(timer);
  }, [open, present]);

  return (
    <Dialog.Root
      open={present}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="halo-modal-overlay" />
        <Dialog.Content
          className={`halo-modal-content${frame.danger ? " is-danger" : ""}${
            frame.className ? ` ${frame.className}` : ""
          }`}
          {...(frame.description ? {} : { "aria-describedby": undefined })}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
          }}
        >
          <div className="halo-modal-header">
            <div className="halo-modal-header-copy">
              {frame.icon ? (
                <span className={`halo-modal-icon${frame.danger ? " is-danger" : ""}`}>
                  {frame.icon}
                </span>
              ) : null}
              <div>
                <Dialog.Title asChild>
                  <h3>{frame.title}</h3>
                </Dialog.Title>
                {frame.description ? (
                  <Dialog.Description asChild>
                    <p>{frame.description}</p>
                  </Dialog.Description>
                ) : null}
              </div>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="icon-button tiny" aria-label={frame.closeLabel}>
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {frame.children ? <div className="halo-modal-body">{frame.children}</div> : null}

          {frame.footer ? <div className="halo-modal-footer">{frame.footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
