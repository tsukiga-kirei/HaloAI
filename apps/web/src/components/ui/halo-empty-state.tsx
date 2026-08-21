import type { ReactNode } from "react";

/**
 * 空态是一等界面：图标、标题和下一步说明，而不是一行灰字。
 */
export function HaloEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="halo-empty-state">
      <span className="halo-empty-icon" aria-hidden="true">
        {icon}
      </span>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
