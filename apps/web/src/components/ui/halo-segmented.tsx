"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { animateThumb } from "@/lib/motion";

export interface HaloSegmentedItem<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

/**
 * 分段页签宽度跟随选项，不拉满整行。登录页用 is-fill 铺满卡片并与提交按钮同色。
 */
export function HaloSegmented<T extends string>({
  value,
  onChange,
  items,
  ariaLabel,
  fill = false,
}: {
  value: T;
  onChange: (value: T) => void;
  items: ReadonlyArray<HaloSegmentedItem<T>>;
  ariaLabel: string;
  fill?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const readyRef = useRef(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const thumb = thumbRef.current;
    if (!root || !thumb) return;
    const active = root.querySelector<HTMLElement>("[data-active='true']");
    if (!active) return;
    const rootBox = root.getBoundingClientRect();
    const box = active.getBoundingClientRect();
    animateThumb(thumb, box.left - rootBox.left, box.width, { immediate: !readyRef.current });
    readyRef.current = true;
  }, [value, items, fill]);

  return (
    <div
      ref={rootRef}
      className={`halo-segmented${fill ? " is-fill" : ""}`}
      role="tablist"
      aria-label={ariaLabel}
      style={{ "--segment-count": items.length } as CSSProperties}
    >
      <span className="halo-segmented-thumb" ref={thumbRef} aria-hidden="true" />
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.value === value;
        return (
          <button
            type="button"
            role="tab"
            aria-selected={active}
            data-active={active ? "true" : "false"}
            className={active ? "is-active" : ""}
            key={item.value}
            onClick={() => onChange(item.value)}
          >
            {Icon ? <Icon size={15} /> : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
