import { Plus, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function HaloMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "halo-mark is-compact" : "halo-mark"} aria-hidden="true">
      <span className="halo-orbit" />
      <span className="halo-letter">H</span>
    </span>
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
  children,
}: {
  title: string;
  actionLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="sidebar-section">
      <div className="sidebar-section-heading">
        <span>{title}</span>
        {actionLabel === undefined ? null : (
          <button type="button" className="icon-button tiny" aria-label={actionLabel} title={actionLabel}>
            <Plus size={14} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
