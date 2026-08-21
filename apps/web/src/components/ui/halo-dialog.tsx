"use client";

import * as Dialog from "@radix-ui/react-dialog";
import gsap from "gsap";
import { X } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  createDrawerTimeline,
  prefersReducedMotion,
  showDrawerImmediate,
} from "@/lib/motion";

/**
 * 表单与创建流程使用右侧抽屉：顶栏、滚动区、可选固定底栏。
 * Radix 负责焦点与 Esc；GSAP 时间线负责飞入/飞回，节点挂载后再 play，关闭时 reverse。
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
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const openRef = useRef(open);
  const [present, setPresent] = useState(open);
  openRef.current = open;

  const attachOverlay = useCallback((node: HTMLDivElement | null) => {
    overlayRef.current = node;
  }, []);

  const attachContent = useCallback((node: HTMLDivElement | null) => {
    if (node === contentRef.current && timelineRef.current) return;
    contentRef.current = node;
    timelineRef.current?.kill();
    timelineRef.current = null;
    if (!node) return;
    if (prefersReducedMotion()) {
      showDrawerImmediate(node, overlayRef.current);
      return;
    }
    const timeline = createDrawerTimeline(node, overlayRef.current);
    timelineRef.current = timeline;
    if (openRef.current) timeline.timeScale(1).play(0);
  }, []);

  useLayoutEffect(() => {
    if (open) {
      setPresent(true);
      timelineRef.current?.eventCallback("onReverseComplete", null);
      timelineRef.current?.timeScale(1).play();
      return;
    }
    if (!present) return;
    const timeline = timelineRef.current;
    if (!timeline || prefersReducedMotion()) {
      setPresent(false);
      return;
    }
    timeline.eventCallback("onReverseComplete", () => {
      setPresent(false);
    });
    timeline.timeScale(1.2).reverse();
  }, [open, present]);

  return (
    <Dialog.Root
      open={present}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="halo-dialog-overlay" ref={attachOverlay} />
        <Dialog.Content
          ref={attachContent}
          className={`halo-dialog-content${size === "wide" ? " is-wide" : ""}${
            footer ? " has-footer" : ""
          }${className ? ` ${className}` : ""}`}
          {...(description ? {} : { "aria-describedby": undefined })}
          onOpenAutoFocus={(event) => {
            // 打开时先让位移跑完，避免焦点把滚动和动画抢在同一帧。
            event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
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
