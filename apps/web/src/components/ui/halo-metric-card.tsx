import type { ReactNode } from "react";

export type HaloMetricTone = "violet" | "blue" | "mint" | "amber";

/**
 * 协作总览与管理总览共用同一套彩色指标卡，避免系统页落回无色白卡片。
 */
export function HaloMetricCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
  tone: HaloMetricTone;
}) {
  return (
    <article className={`halo-metric-card tone-${tone}`}>
      <div className="halo-metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}
