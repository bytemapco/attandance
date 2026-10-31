"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StudentLogsPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalFiltered: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function StudentLogsPagination({
  currentPage,
  totalPages,
  pageSize,
  totalFiltered,
  onPageChange,
  onPageSizeChange,
}: StudentLogsPaginationProps): React.ReactElement {
  return (
    <div className="p-3.5 border-t border-[#e3e1dc] bg-[#eeece7]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#526f78]">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="bg-white border border-[#e3e1dc] rounded-lg px-2 py-1 text-xs text-[#202b30] outline-none"
        >
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span className="ml-2">
          Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalFiltered)} of {totalFiltered}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="p-1.5 rounded-lg border border-[#e3e1dc] bg-white text-[#28363b] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#eeece7] transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="font-semibold text-[#202b30] px-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="p-1.5 rounded-lg border border-[#e3e1dc] bg-white text-[#28363b] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#eeece7] transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
