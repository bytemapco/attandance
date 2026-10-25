"use client";

import React from "react";
import { Search, Filter, X, RotateCcw } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface ToolbarFilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export interface EnterpriseTableToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearch: (value: string) => void;
  filters?: ToolbarFilterConfig[];
  onResetAll?: () => void;
  // Backward compatibility
  filterLabel?: string;
  filterOptions?: FilterOption[];
  selectedFilter?: string;
  onFilterChange?: (value: string) => void;
  statusOptions?: FilterOption[];
  selectedStatus?: string;
  onStatusChange?: (value: string) => void;
}

export default function EnterpriseTableToolbar({
  searchPlaceholder = "Search by name, email, ID...",
  searchValue = "",
  onSearch,
  filters,
  onResetAll,
  filterLabel = "Filter",
  filterOptions = [],
  selectedFilter = "all",
  onFilterChange,
  statusOptions = [],
  selectedStatus = "all",
  onStatusChange,
}: EnterpriseTableToolbarProps): React.ReactElement {
  // Merge legacy filters into unified list if filters array not directly provided
  const resolvedFilters: ToolbarFilterConfig[] = filters ?? [
    ...(filterOptions.length > 0 && onFilterChange
      ? [{ id: "legacy-filter", label: filterLabel, options: filterOptions, value: selectedFilter, onChange: onFilterChange }]
      : []),
    ...(statusOptions.length > 0 && onStatusChange
      ? [{ id: "legacy-status", label: "Status", options: statusOptions, value: selectedStatus, onChange: onStatusChange }]
      : []),
  ];

  const activeFilters = resolvedFilters.filter((f) => f.value && f.value !== "all");
  const hasActiveCriteria = activeFilters.length > 0 || Boolean(searchValue?.trim());

  function handleReset(): void {
    if (onResetAll) {
      onResetAll();
    } else {
      resolvedFilters.forEach((f) => f.onChange("all"));
      if (searchValue) onSearch("");
    }
  }

  return (
    <div className="space-y-2 mb-3">
      {/* Primary Control Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-8 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-colors shadow-2xs"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        {resolvedFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {resolvedFilters.map((filter) => {
              const selectedOpt = filter.options.find((o) => o.value === filter.value);
              const selectedLabel = filter.value === "all" ? "All" : (selectedOpt?.label ?? filter.value);

              return (
                <Select
                  key={filter.id}
                  value={filter.value || "all"}
                  onValueChange={(val) => filter.onChange(val)}
                >
                  <SelectTrigger
                    className={cn(
                      "h-9 w-auto min-w-[130px] gap-2 px-3 rounded-lg border text-xs shadow-2xs",
                      filter.value && filter.value !== "all"
                        ? "border-slate-400/80 bg-secondary/80 font-semibold text-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
                    )}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {filter.icon ?? (
                        <Filter
                          size={12}
                          className={
                            filter.value && filter.value !== "all"
                              ? "text-primary shrink-0"
                              : "text-muted-foreground shrink-0"
                          }
                        />
                      )}
                      <span className="text-muted-foreground font-medium">{filter.label}:</span>
                      <span className="text-foreground font-medium truncate max-w-[110px]">{selectedLabel}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-80 min-w-[140px]">
                    <SelectItem value="all">All</SelectItem>
                    {filter.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            })}

            {hasActiveCriteria && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 h-9 px-2.5 rounded-lg border border-border/80 bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shadow-2xs cursor-pointer"
                title="Reset all active filters"
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active Filter Chips Row */}
      {hasActiveCriteria && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs text-muted-foreground">
          <span className="text-[11px] font-medium text-muted-foreground">Active filters:</span>
          {searchValue?.trim() && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary border border-border text-[11px] font-medium text-foreground">
              Search: <span className="font-semibold">&ldquo;{searchValue}&rdquo;</span>
              <button type="button" onClick={() => onSearch("")} className="hover:text-destructive">
                <X size={11} />
              </button>
            </span>
          )}
          {activeFilters.map((f) => {
            const selectedOpt = f.options.find((o) => o.value === f.value);
            const displayLabel = selectedOpt?.label ?? f.value;
            return (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary border border-border text-[11px] font-medium text-foreground"
              >
                {f.label}: <span className="font-semibold">{displayLabel}</span>
                <button type="button" onClick={() => f.onChange("all")} className="hover:text-destructive" title={`Remove ${f.label} filter`}>
                  <X size={11} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

