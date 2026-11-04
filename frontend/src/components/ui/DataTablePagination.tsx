"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataTablePaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export default function DataTablePagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
}: DataTablePaginationProps): React.ReactElement {
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-card text-xs text-muted-foreground">
      <span>
        Showing <strong className="font-semibold text-foreground font-mono">{start}</strong> to{" "}
        <strong className="font-semibold text-foreground font-mono">{end}</strong> of{" "}
        <strong className="font-semibold text-foreground font-mono">{totalItems}</strong> results
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-secondary disabled:pointer-events-none disabled:opacity-40 transition-colors cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="px-2 font-medium text-foreground font-mono">
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-secondary disabled:pointer-events-none disabled:opacity-40 transition-colors cursor-pointer"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
