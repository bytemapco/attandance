"use client";

import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TableColumnHeader<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface GlassTableHeaderProps<T> {
  columns: TableColumnHeader<T>[];
  activeSortKey: string | null;
  isAsc: boolean;
  onSort: (key: string) => void;
}

export default function GlassTableHeader<T>({
  columns,
  activeSortKey,
  isAsc,
  onSort,
}: GlassTableHeaderProps<T>): React.ReactElement {
  return (
    <thead className="border-b border-border bg-secondary/80">
      <tr>
        {columns.map((col) => {
          const isActive = activeSortKey === col.key;
          return (
            <th
              key={col.key}
              onClick={col.sortable ? () => onSort(col.key) : undefined}
              className={cn(
                "h-10 px-4 text-xs font-semibold tracking-wide select-none whitespace-nowrap",
                isActive ? "text-primary font-bold" : "text-muted-foreground",
                col.sortable && "cursor-pointer hover:text-primary"
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                {col.header}
                {col.sortable && (
                  isActive ? (
                    isAsc ? (
                      <ArrowUp size={12} className="text-accent-strong" />
                    ) : (
                      <ArrowDown size={12} className="text-accent-strong" />
                    )
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
  );
}
