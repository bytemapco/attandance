"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EnterprisePaginationProps {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  itemName?: string;
  pageSizeOptions?: number[];
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export default function EnterprisePagination({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemName = "records",
  pageSizeOptions = [10, 20, 50, 100],
}: EnterprisePaginationProps): React.JSX.Element {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalItems === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endItem = Math.min(validPage * pageSize, totalItems);
  const pageNumbers = getPageNumbers(validPage, totalPages);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-border bg-card rounded-b-xl text-xs text-muted-foreground">
      <p className="select-none">
        Showing <span className="font-semibold text-foreground">{startItem.toLocaleString()}</span> to{" "}
        <span className="font-semibold text-foreground">{endItem.toLocaleString()}</span> of{" "}
        <span className="font-semibold text-foreground">{totalItems.toLocaleString()}</span> {itemName}{" "}
        <span className="text-muted-foreground/60">(Page {validPage} of {totalPages})</span>
      </p>

      <div className="flex items-center gap-1 self-end sm:self-auto flex-wrap">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={validPage <= 1}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
          title="First Page"
          aria-label="First page"
        >
          <ChevronsLeft size={13} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(validPage - 1)}
          disabled={validPage <= 1}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
          title="Previous Page"
          aria-label="Previous page"
        >
          <ChevronLeft size={13} />
        </button>

        {pageNumbers.map((page, idx) => {
          if (typeof page === "string") {
            return (
              <span key={`ellipsis-${idx}`} className="h-7 min-w-7 flex items-center justify-center text-xs text-muted-foreground select-none">
                ...
              </span>
            );
          }

          const isActive = page === validPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-7 min-w-7 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(validPage + 1)}
          disabled={validPage >= totalPages}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
          title="Next Page"
          aria-label="Next page"
        >
          <ChevronRight size={13} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={validPage >= totalPages}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
          title="Last Page"
          aria-label="Last page"
        >
          <ChevronsRight size={13} />
        </button>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
            <span className="text-[11px] text-muted-foreground">Rows:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="h-7 w-[68px] px-2 text-xs border-border bg-card text-foreground shadow-2xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" className="min-w-[70px]">
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
