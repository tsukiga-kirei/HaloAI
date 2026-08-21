"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { HaloChoicePills } from "./halo-choice-pills";

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export interface HaloPaginationLabels {
  readonly previous: string;
  readonly next: string;
  readonly summary: string;
  readonly pageSize: string;
}

/**
 * 管理列表共用的页码分页。页码从 1 开始；10/20/50 用药丸而不是下拉。
 * 调用方必须先完成权限过滤再传入 total 与当前页，禁止用分页扩大可见范围。
 */
export function HaloPagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  labels,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  labels: HaloPaginationLabels;
  className?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
  const currentPage = Math.min(Math.max(page, 1), pageCount);

  return (
    <footer className={`halo-pagination${className ? ` ${className}` : ""}`}>
      <span>
        {labels.summary
          .replace("{page}", String(currentPage))
          .replace("{pages}", String(pageCount))
          .replace("{total}", String(total))}
      </span>
      <div className="halo-pagination-actions">
        <HaloChoicePills
          value={String(pageSize)}
          ariaLabel={labels.pageSize.replace("{size}", String(pageSize))}
          onChange={(value) => {
            onPageSizeChange(Number(value));
            onPageChange(1);
          }}
          options={PAGE_SIZE_OPTIONS.map((size) => ({
            value: String(size),
            label: labels.pageSize.replace("{size}", String(size)),
          }))}
        />
        <button
          type="button"
          aria-label={labels.previous}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          aria-label={labels.next}
          disabled={currentPage >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </footer>
  );
}
