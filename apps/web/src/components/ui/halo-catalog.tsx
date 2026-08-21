"use client";

import type { ReactNode } from "react";
import { HaloPagination, type HaloPaginationLabels } from "./halo-pagination";

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
  labels: HaloPaginationLabels & { readonly loading: string };
}) {
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
      <HaloPagination
        className="is-inset"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        labels={labels}
      />
    </section>
  );
}
