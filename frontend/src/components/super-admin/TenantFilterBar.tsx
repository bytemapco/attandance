"use client";

import React from "react";
import SearchInput from "@/components/ui/SearchInput";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectMenu";

interface TenantFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onReset: () => void;
}

export default function TenantFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onReset,
}: TenantFilterBarProps): React.ReactElement {
  const hasActiveFilters = Boolean(searchQuery || statusFilter);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-card rounded-lg border border-border mb-4">
      <div className="flex-1 max-w-md">
        <SearchInput
          placeholder="Search by institution name or slug..."
          value={searchQuery}
          onSearch={onSearchChange}
        />
      </div>

      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <Filter size={14} />
          <span>Filters:</span>
        </div>

        <Select value={statusFilter || "ALL_STATUSES"} onValueChange={(val) => onStatusChange(val === "ALL_STATUSES" ? "" : val)}>
          <SelectTrigger aria-label="Filter by institution status" className="h-9 min-w-[125px] text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL_STATUSES">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground underline px-2 py-1 transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
