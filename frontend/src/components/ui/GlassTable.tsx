"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import GlassErrorState from "./GlassErrorState";
import GlassTableHeader, { type TableColumnHeader } from "./GlassTableHeader";
import GlassTablePagination from "./GlassTablePagination";
import { Skeleton } from "./Skeleton";

export type TableColumn<T> = TableColumnHeader<T>;

export interface GlassTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (key: string) => void;
  rowKey?: (row: T) => string;
}

function sortByColumn<T extends Record<string, unknown>>(a: T, b: T, key: string, asc: boolean): number {
  const aVal = a[key];
  const bVal = b[key];
  if (aVal === bVal) return 0;
  if (aVal == null) return 1;
  if (bVal == null) return -1;
  const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
  return asc ? cmp : -cmp;
}

export default function GlassTable<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize = 10,
  emptyMessage = "No records found",
  onRowClick,
  className = "",
  loading = false,
  error = null,
  onRetry,
  sortBy,
  sortOrder = "asc",
  onSortChange,
  rowKey,
}: GlassTableProps<T>): React.ReactElement {
  const [page, setPage] = useState(0);
  const [internalSortKey, setInternalSortKey] = useState<string | null>(null);
  const [internalSortAsc, setInternalSortAsc] = useState(true);

  const activeSortKey = sortBy !== undefined ? sortBy : internalSortKey;
  const isAsc = sortBy !== undefined ? sortOrder === "asc" : internalSortAsc;

  const sorted = useMemo(() => {
    if (sortBy !== undefined) return data;
    if (!activeSortKey) return data;
    return [...data].sort((a, b) => sortByColumn(a, b, activeSortKey, isAsc));
  }, [data, activeSortKey, isAsc, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sortBy !== undefined ? data : sorted.slice(page * pageSize, (page + 1) * pageSize);

  function handleSort(key: string): void {
    if (onSortChange) {
      onSortChange(key);
      return;
    }
    if (internalSortKey === key) {
      setInternalSortAsc(!internalSortAsc);
    } else {
      setInternalSortKey(key);
      setInternalSortAsc(true);
    }
    setPage(0);
  }

  if (loading) {
    return (
      <div className={cn("rounded-lg border border-border bg-card shadow-xs overflow-hidden", className)}>
        <div className="space-y-4 p-4" role="status" aria-label="Loading table data" aria-busy="true">
          <span className="sr-only">Loading table data</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} aria-hidden="true" className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="hidden h-7 w-24 sm:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-lg border border-border bg-card shadow-xs overflow-hidden", className)}>
        <GlassErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  const isEmpty = data.length === 0;

  return (
    <div className={cn("rounded-lg border border-border bg-card shadow-xs overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <GlassTableHeader
            columns={columns}
            activeSortKey={activeSortKey}
            isAsc={isAsc}
            onSort={handleSort}
          />
          <tbody className="divide-y divide-border">
            {isEmpty ? (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center text-sm font-medium text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => {
                const rowId = rowKey ? rowKey(row) : (row.id != null ? String(row.id) : String(i));
                return (
                  <tr
                    key={rowId}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "transition-colors hover:bg-secondary/40",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="p-3.5 sm:p-4 text-xs sm:text-sm text-foreground align-middle">
                        {col.render ? col.render(row) : (row[col.key] as React.ReactNode) ?? "—"}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {sortBy === undefined && totalPages > 1 && (
        <GlassTablePagination
          page={page}
          pageSize={pageSize}
          totalItems={sorted.length}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
