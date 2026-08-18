"use client";

import { AlertCircle, Inbox, LoaderCircle, RefreshCw, Search } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import type { SystemAdminDictionary } from "@/lib/system-admin-i18n";

export function SystemStatusBadge({
  tone,
  children,
}: {
  tone: "success" | "warning" | "muted";
  children: ReactNode;
}) {
  return <span className={`admin-status-badge is-${tone}`}>{children}</span>;
}

export function SystemSectionState({
  kind,
  label,
  retryLabel,
  onRetry,
}: {
  kind: "loading" | "error" | "empty";
  label: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  const Icon = kind === "loading" ? LoaderCircle : kind === "error" ? AlertCircle : Inbox;
  return (
    <div className={`system-section-state is-${kind}`}>
      <span>
        <Icon size={20} />
      </span>
      <p>{label}</p>
      {kind === "error" && onRetry && retryLabel ? (
        <button type="button" className="admin-secondary-button" onClick={onRetry}>
          <RefreshCw size={15} />
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

export function SystemSearchToolbar({
  value,
  placeholder,
  searchLabel,
  action,
  onChange,
}: {
  value: string;
  placeholder: string;
  searchLabel: string;
  action?: ReactNode;
  onChange: (value: string) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onChange(String(data.get("query") ?? ""));
  }

  return (
    <div className="system-toolbar">
      <form className="system-search" onSubmit={submit}>
        <Search size={16} />
        <input
          key={value}
          name="query"
          type="search"
          defaultValue={value}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        <button type="submit">{searchLabel}</button>
      </form>
      {action}
    </div>
  );
}

export function paginationLabels(dictionary: SystemAdminDictionary) {
  return {
    previous: dictionary.previousPage,
    next: dictionary.nextPage,
    summary: dictionary.pageSummary,
    pageSize: dictionary.pageSize,
    loading: dictionary.loading,
  };
}

export function formatSystemDate(value: string, locale: "zh-CN" | "en-US"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
