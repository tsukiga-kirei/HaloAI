import { Plus, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

/** 网页图标、登录页和侧栏共用同一份 SVG，只允许尺寸变化，不允许换图形或圆角比例。 */
export function HaloMark({
  compact = false,
  size,
}: {
  compact?: boolean;
  size?: "default" | "compact" | "brand";
}) {
  const resolved = size ?? (compact ? "compact" : "default");
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icon.svg" alt="" aria-hidden="true" className={`halo-mark is-${resolved}`} />
  );
}

export function Avatar({
  initials,
  color,
  ai = false,
  size = "medium",
}: {
  initials: string;
  color: string;
  ai?: boolean;
  size?: "small" | "medium" | "large";
}) {
  return (
    <span className={`avatar avatar-${color} avatar-${size} ${ai ? "avatar-ai" : ""}`}>
      {initials}
      {ai ? <Sparkles className="avatar-ai-mark" size={10} aria-hidden="true" /> : null}
    </span>
  );
}

export function SidebarSection({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="sidebar-section">
      <div className="sidebar-section-heading">
        <span>{title}</span>
        {actionLabel === undefined ? null : (
          <button
            type="button"
            className="icon-button tiny"
            aria-label={actionLabel}
            title={actionLabel}
            onClick={onAction}
          >
            <Plus size={14} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
