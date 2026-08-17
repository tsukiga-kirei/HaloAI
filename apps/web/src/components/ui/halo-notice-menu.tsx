"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { animateOverlayIn } from "@/lib/motion";

/**
 * 后续能力入口：用统一下拉说明，而不是另做一套贴边 Toast 气泡。
 */
export function HaloNoticeMenu({
  label,
  message,
  disabled = false,
  triggerClassName = "icon-button",
  icon,
}: {
  label: string;
  message: string;
  disabled?: boolean;
  triggerClassName?: string;
  icon?: ReactNode;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={triggerClassName}
          aria-label={label}
          title={label}
          disabled={disabled}
        >
          {icon ?? <MoreHorizontal size={18} />}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="halo-menu-content is-notice"
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          ref={(node) => {
            if (node) animateOverlayIn(node);
          }}
        >
          <p className="halo-menu-notice">{message}</p>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
