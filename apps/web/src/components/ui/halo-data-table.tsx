"use client";

import { flexRender, type RowData } from "@tanstack/react-table";
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from "@tanstack/react-table/legacy";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { HaloSelect } from "./halo-select";

interface PaginationLabels {
  readonly previous: string;
  readonly next: string;
  readonly summary: string;
  readonly pageSize: string;
  readonly loading: string;
}

/**
 * 系统管理列表统一使用 TanStack 的分页状态与表格行模型。服务端仍负责切片与总数，
 * 避免把全部跨租户目录加载进浏览器；移动端通过同一语义表格转换为卡片行。
 */
export function HaloDataTable<T extends RowData>({
  columns,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading,
  empty,
  labels,
}: {
  columns: LegacyColumnDef<T>[];
  data: T[];
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
  const table = useLegacyTable<T>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: total,
    state: { pagination: { pageIndex: page - 1, pageSize } },
  });

  return (
    <section className="system-table-shell">
      <div className="system-table-scroll">
        <table className="system-data-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} scope="col">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr className="system-table-state-row">
                <td colSpan={columns.length}>{labels.loading}</td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr className="system-table-state-row">
                <td colSpan={columns.length}>{empty}</td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    const header = cell.column.columnDef.header;
                    const label = typeof header === "string" ? header : cell.column.id;
                    return (
                      <td key={cell.id} data-label={label}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <footer className="system-pagination">
        <span>
          {labels.summary
            .replace("{page}", String(page))
            .replace("{pages}", String(pageCount))
            .replace("{total}", String(total))}
        </span>
        <div className="system-pagination-actions">
          <HaloSelect
            compact
            value={String(pageSize)}
            ariaLabel={labels.pageSize.replace("{size}", String(pageSize))}
            onValueChange={(value) => onPageSizeChange(Number(value))}
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
