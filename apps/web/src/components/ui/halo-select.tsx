"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { animateOverlayIn } from "@/lib/motion";

export interface HaloSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

/**
 * 统一下拉：Radix 负责定位与键盘操作，样式只使用 Halo token。
 * 禁止再用原生 select，避免系统蓝底选项破坏产品外观。
 */
export function HaloSelect({
  value,
  onValueChange,
  options,
  placeholder,
  ariaLabel,
  name,
  disabled = false,
  compact = false,
  prefix,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly HaloSelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  name?: string;
  disabled?: boolean;
  compact?: boolean;
  prefix?: ReactNode;
}) {
  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <Select.Root
        {...(value.length > 0 ? { value } : {})}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <Select.Trigger
          className={`halo-select-trigger${compact ? " is-compact" : ""}`}
          aria-label={ariaLabel}
        >
          {prefix}
          <span className="halo-select-value">
            <Select.Value placeholder={placeholder} />
          </span>
          <ChevronDown size={16} aria-hidden="true" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="halo-select-content"
            position="popper"
            sideOffset={6}
            collisionPadding={8}
            ref={(node) => {
              if (node) animateOverlayIn(node);
            }}
          >
            <Select.Viewport>
              {options.map((option) => (
                <Select.Item className="halo-select-item" key={option.value} value={option.value}>
                  <span className="halo-select-indicator">
                    <Select.ItemIndicator>
                      <Check size={14} />
                    </Select.ItemIndicator>
                  </span>
                  {option.icon}
                  <Select.ItemText>{option.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </>
  );
}
