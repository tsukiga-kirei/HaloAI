"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { HaloChoicePills } from "./halo-choice-pills";

interface PaginationLabels {
  readonly previous: string;
  readonly next: string;
  readonly summary: string;
  readonly pageSize: string;
  readonly loading: string;
}

/**
 * 系统目录用卡片网格承载跨租户列表。分页条与容器边缘保持内边距；每页数量用药丸，
 * 避免移动端在分区栏下再出现下拉框。
 */
export function HaloCatalog({
  children,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading,
  empty,
  labels,
}: {
  children: ReactNode;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  loading: boolean;
  empty: ReactNode;
  labels: PaginationLabels;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const hasItems = !loading && total > 0;

  return (
    <section className="system-catalog-shell">
      {loading ? (
        <div className="system-catalog-state">{labels.loading}</div>
      ) : hasItems ? (
        <div className="system-catalog-grid">{children}</div>
      ) : (
        <div className="system-catalog-state">{empty}</div>
      )}
      <footer className="system-pagination">
        <span>
          {labels.summary
            .replace("{page}", String(page))
            .replace("{pages}", String(pageCount))
            .replace("{total}", String(total))}
        </span>
        <div className="system-pagination-actions">
          <HaloChoicePills
            value={String(pageSize)}
            ariaLabel={labels.pageSize.replace("{size}", String(pageSize))}
            onChange={(value) => onPageSizeChange(Number(value))}
            options={[10, 20, 50].map((size) => ({
              value: String(size),
              label: labels.pageSize.replace("{size}", String(size)),
            }))}
          />
          <button
            type="button"
            aria-label={labels.previous}
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label={labels.next}
            disabled={page >= pageCount}
            onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </section>
  );
}
