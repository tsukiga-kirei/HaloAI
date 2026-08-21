import type { ReactNode } from "react";

/**
 * 管理画布页头与侧栏分区对齐：kicker 是分组名，标题是当前页，说明只占一行。
 */
export function AdminPageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="admin-section-heading">
      <div>
        <span className="admin-page-kicker">{kicker}</span>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="admin-section-heading-actions">{actions}</div> : null}
    </header>
  );
}
