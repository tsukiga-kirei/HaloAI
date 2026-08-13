import { FileText, Hash, LayoutDashboard, MessageCircleMore } from "lucide-react";
import type { MobileView, WorkspaceViewProps } from "./types";

export function MobileNavigation({
  dictionary,
  view,
  onViewChange,
}: WorkspaceViewProps & {
  view: MobileView;
  onViewChange: (view: MobileView) => void;
}) {
  return (
    <nav className="mobile-navigation" aria-label={dictionary.mobileNavigation}>
      <button
        type="button"
        className={view === "rooms" ? "is-active" : ""}
        onClick={() => onViewChange("rooms")}
      >
        <Hash size={19} />
        <span>{dictionary.rooms}</span>
      </button>
      <button
        type="button"
        className={view === "chat" ? "is-active" : ""}
        onClick={() => onViewChange("chat")}
      >
        <MessageCircleMore size={19} />
        <span>{dictionary.chat}</span>
      </button>
      <button
        type="button"
        className={view === "document" ? "is-active" : ""}
        onClick={() => onViewChange("document")}
      >
        <FileText size={19} />
        <span>{dictionary.document}</span>
      </button>
      <button
        type="button"
        className={view === "inbox" ? "is-active" : ""}
        onClick={() => onViewChange("inbox")}
      >
        <LayoutDashboard size={19} />
        <span>{dictionary.workspaceHome}</span>
      </button>
    </nav>
  );
}
