"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createDrawerTimeline, prefersReducedMotion, showDrawerImmediate } from "@/lib/motion";
import { useShellPreferences } from "@/lib/shell-preferences";

/**
 * 表单与创建流程使用右侧抽屉：顶栏、滚动区、可选固定底栏。
 * Radix 负责焦点与 Esc；GSAP 时间线负责飞入/飞回。
 * 必须等遮罩和面板都挂上再建时间线，并用 gsap.set 接管 CSS transform。
 * 飞回期间沿用最后一帧打开内容，避免父组件先清空选中项导致文字先消失再滑走。
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
  closeLabel,
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
  const { locale } = useShellPreferences();
  const effectiveCloseLabel = closeLabel ?? (locale === "zh-CN" ? "关闭" : "Close");
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const openRef = useRef(open);
  const [present, setPresent] = useState(open);
  openRef.current = open;
  // 关闭时父组件常把选中项置空，children 会先变成空树。飞回期间必须沿用最后一帧打开内容。
  const frameRef = useRef({
    title,
    description,
    icon,
    footer,
    children,
    className,
    size,
    closeLabel: effectiveCloseLabel,
  });
  if (open) {
    frameRef.current = {
      title,
      description,
      icon,
      footer,
      children,
      className,
      size,
      closeLabel: effectiveCloseLabel,
    };
  }
  const frame = frameRef.current;

  const playMounted = useCallback(() => {
    const content = contentRef.current;
    const overlay = overlayRef.current;
    if (!content || !overlay) return;
    timelineRef.current?.kill();
    if (prefersReducedMotion()) {
      showDrawerImmediate(content, overlay);
      timelineRef.current = null;
      return;
    }
    const timeline = createDrawerTimeline(content, overlay);
    timelineRef.current = timeline;
    if (openRef.current) timeline.play(0);
  }, []);

  const attachOverlay = useCallback(
    (node: HTMLDivElement | null) => {
      overlayRef.current = node;
      if (node) playMounted();
    },
    [playMounted],
  );

  const attachContent = useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      if (!node) {
        timelineRef.current?.kill();
        timelineRef.current = null;
        return;
      }
      playMounted();
    },
    [playMounted],
  );

  useLayoutEffect(() => {
    if (open) {
      setPresent(true);
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
          className={`halo-dialog-content${frame.size === "wide" ? " is-wide" : ""}${
            frame.footer ? " has-footer" : ""
          }${frame.className ? ` ${frame.className}` : ""}`}
          {...(frame.description ? {} : { "aria-describedby": undefined })}
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
              {frame.icon ? <span className="dialog-icon">{frame.icon}</span> : null}
              <div>
                <Dialog.Title asChild>
                  <h2>{frame.title}</h2>
                </Dialog.Title>
                {frame.description ? (
                  <Dialog.Description asChild>
                    <p>{frame.description}</p>
                  </Dialog.Description>
                ) : null}
              </div>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="icon-button" aria-label={frame.closeLabel}>
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>
          <div className="halo-dialog-body">{frame.children}</div>
          {frame.footer ? <div className="halo-dialog-footer">{frame.footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
