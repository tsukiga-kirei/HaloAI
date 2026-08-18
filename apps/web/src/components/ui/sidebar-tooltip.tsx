"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactElement } from "react";

/** 收起侧栏后的名称提示使用 Portal，避免被侧栏滚动容器裁切。 */
export function SidebarTooltip({
  enabled,
  label,
  children,
}: {
  enabled: boolean;
  label: string;
  children: ReactElement;
}) {
  if (!enabled) return children;
  return (
    <Tooltip.Provider delayDuration={180} skipDelayDuration={80}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="sidebar-item-tooltip"
            side="right"
            sideOffset={9}
            collisionPadding={12}
          >
            {label}
            <Tooltip.Arrow className="sidebar-item-tooltip-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
