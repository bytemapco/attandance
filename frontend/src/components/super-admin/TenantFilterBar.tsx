"use client";

import React from "react";
import GlassSearch from "@/components/ui/GlassSearch";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TenantFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  typeFilter: string;
  onTypeChange: (type: string) => void;
  onReset: () => void;
}

export default function TenantFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  onReset,
}: TenantFilterBarProps): React.ReactElement {
  const hasActiveFilters = Boolean(searchQuery || statusFilter || typeFilter);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-card rounded-xl border border-border mb-4">
      <div className="flex-1 max-w-md">
        <GlassSearch
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

        <Select value={typeFilter || "ALL_TYPES"} onValueChange={(val) => onTypeChange(val === "ALL_TYPES" ? "" : val)}>
          <SelectTrigger aria-label="Filter by institution type" className="h-9 min-w-[120px] text-xs">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL_TYPES">All Types</SelectItem>
            <SelectItem value="SCHOOL">School</SelectItem>
            <SelectItem value="COLLEGE">College</SelectItem>
            <SelectItem value="COACHING_CENTER">Coaching Center</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter || "ALL_STATUSES"} onValueChange={(val) => onStatusChange(val === "ALL_STATUSES" ? "" : val)}>
          <SelectTrigger aria-label="Filter by institution status" className="h-9 min-w-[125px] text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL_STATUSES">All Statuses</SelectItem>
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
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
