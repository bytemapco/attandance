"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import GlassErrorState from "./GlassErrorState";

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

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
    if (sortBy !== undefined) return data; // Server-sorted
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
      <div className={cn("rounded-xl border border-border bg-card shadow-sm overflow-hidden", className)}>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded-lg bg-secondary/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-xl border border-border bg-card shadow-sm overflow-hidden", className)}>
        <GlassErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  const isEmpty = data.length === 0;

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {columns.map((col) => {
                const isActive = activeSortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    className={cn(
                      "h-10 px-4 text-xs font-semibold tracking-wide select-none whitespace-nowrap",
                      isActive ? "text-foreground font-bold" : "text-muted-foreground",
                      col.sortable && "cursor-pointer hover:text-foreground"
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.header}
                      {col.sortable && (
                        isActive ? (
                          isAsc ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                        ) : (
                          <ArrowUpDown size={12} className="opacity-40" />
                        )
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
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
                      "transition-colors hover:bg-muted/50",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="p-4 text-sm text-foreground align-middle">
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
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-card text-xs text-muted-foreground">
          <span>
            Showing <strong className="font-semibold text-foreground">{page * pageSize + 1}</strong> to{" "}
            <strong className="font-semibold text-foreground">
              {Math.min((page + 1) * pageSize, sorted.length)}
            </strong>{" "}
            of <strong className="font-semibold text-foreground">{sorted.length}</strong> results
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-card text-foreground hover:bg-secondary disabled:pointer-events-none disabled:opacity-40 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 font-medium text-foreground">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-card text-foreground hover:bg-secondary disabled:pointer-events-none disabled:opacity-40 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
