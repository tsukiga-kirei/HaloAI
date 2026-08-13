import { FileText, Hash, Inbox, Languages, MessageCircleMore, Moon, Sun } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { MobileView, Theme, WorkspaceViewProps } from "./types";

export function UtilityRail({
  dictionary,
  locale,
  theme,
  onToggleLocale,
  onToggleTheme,
}: WorkspaceViewProps & {
  locale: Locale;
  theme: Theme;
  onToggleLocale: () => void;
  onToggleTheme: () => void;
}) {
  return (
    <div className="utility-rail" aria-label={dictionary.settings}>
      <button
        type="button"
        className="utility-button"
        onClick={onToggleLocale}
        aria-label={dictionary.language}
        title={dictionary.language}
      >
        <Languages size={18} />
        <span>{locale === "zh-CN" ? "EN" : "中"}</span>
      </button>
      <button
        type="button"
        className="utility-button"
        onClick={onToggleTheme}
        aria-label={dictionary.theme}
        title={dictionary.theme}
      >
        {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </div>
  );
}

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
        <Inbox size={19} />
        <span>{dictionary.inbox}</span>
      </button>
    </nav>
  );
}
