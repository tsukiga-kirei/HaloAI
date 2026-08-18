"use client";

import { AlertCircle, Inbox, LoaderCircle, RefreshCw, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
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
  clearLabel,
  action,
  onChange,
}: {
  value: string;
  placeholder: string;
  searchLabel: string;
  clearLabel: string;
  action?: ReactNode;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const skipSync = useRef(false);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (skipSync.current) {
      skipSync.current = false;
      return;
    }
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = draft.trim();
      if (next !== value) onChangeRef.current(next);
    }, 280);
    return () => window.clearTimeout(handle);
  }, [draft, value]);

  return (
    <div className="system-toolbar">
      <label className="system-search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={draft}
          placeholder={placeholder}
          aria-label={searchLabel}
          onChange={(event) => {
            skipSync.current = true;
            setDraft(event.target.value);
          }}
        />
        {draft ? (
          <button
            type="button"
            className="system-search-clear"
            aria-label={clearLabel}
            onClick={() => {
              skipSync.current = true;
              setDraft("");
              onChange("");
            }}
          >
            <X size={14} />
          </button>
        ) : null}
      </label>
      {action}
    </div>
  );
}

export function SystemFormField({
  icon,
  tone = "violet",
  label,
  hint,
  children,
}: {
  icon: ReactNode;
  tone?: "violet" | "blue";
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="system-form-field">
      <span className={`system-list-icon is-${tone}`}>{icon}</span>
      <span className="system-form-field-copy">
        <strong>{label}</strong>
        {hint ? <small>{hint}</small> : null}
        {children}
      </span>
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
