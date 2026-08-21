import type { ReactNode } from "react";

/**
 * 管理画布页头与侧栏分区对齐：kicker 是分组名，标题是当前页。
 * 产品介绍句不放在页头，空态和抽屉说明除外。
 */
export function AdminPageHeader({
  kicker,
  title,
  actions,
}: {
  kicker: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header className="admin-section-heading">
      <div>
        <span className="admin-page-kicker">{kicker}</span>
        <h1>{title}</h1>
      </div>
      {actions ? <div className="admin-section-heading-actions">{actions}</div> : null}
    </header>
  );
}
