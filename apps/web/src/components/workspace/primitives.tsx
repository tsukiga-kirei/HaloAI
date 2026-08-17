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

const roomTones = ["violet", "teal", "amber", "rose", "slate"] as const;

/** 收起侧栏时不能再用同一套 #，用房间名首字区分。 */
export function roomGlyphLabel(name: string): string {
  const text = name.trim();
  if (text.length === 0) return "#";
  const first = [...text][0] ?? "#";
  return /\p{Script=Han}/u.test(first) ? first : first.toLocaleUpperCase();
}

export function RoomGlyph({ name, id }: { name: string; id: string }) {
  const tone =
    roomTones[[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % roomTones.length] ??
    "slate";
  return <span className={`room-glyph is-${tone}`}>{roomGlyphLabel(name)}</span>;
}

export function SidebarSection({
  title,
  actionLabel,
  onAction,
  children,
  className,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`sidebar-section${className ? ` ${className}` : ""}`}>
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
