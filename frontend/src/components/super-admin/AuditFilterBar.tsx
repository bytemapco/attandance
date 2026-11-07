"use client";

import React from "react";
import { Search, RotateCcw, RefreshCw, Filter } from "lucide-react";
import Button from "@/components/ui/Button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectMenu";

interface AuditFilterBarProps {
  actorSearch: string;
  onActorSearchChange: (val: string) => void;
  eventTypeFilter: string;
  eventTypes?: string[];
  onEventTypeFilterChange: (val: string) => void;
  onReset: () => void;
  onRefresh: () => void;
}

function formatEventTypeName(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function AuditFilterBar({
  actorSearch,
  onActorSearchChange,
  eventTypeFilter,
  eventTypes = [],
  onEventTypeFilterChange,
  onReset,
  onRefresh,
}: AuditFilterBarProps): React.ReactElement {
  const dynamicEventTypeOptions = React.useMemo(() => {
    const list = [{ value: "ALL", label: "All Event Types" }];
    const unique = Array.from(new Set(eventTypes.filter(Boolean)));
    for (const val of unique) {
      list.push({
        value: val,
        label: formatEventTypeName(val),
      });
    }
    return list;
  }, [eventTypes]);

  return (
    <div className="bg-card border border-border rounded-lg p-3 sm:p-4 mb-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
      {/* Actor / User Search */}
      <div className="relative flex-1 max-w-full lg:max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Filter by actor email or system agent..."
          value={actorSearch}
          onChange={(e) => onActorSearchChange(e.target.value)}
          className="w-full h-9 pl-9 pr-4 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
        />
      </div>

      {/* Select Filters & Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground mr-1">
          <Filter size={13} />
          <span>Filters:</span>
        </div>

        <Select value={eventTypeFilter} onValueChange={onEventTypeFilterChange}>
          <SelectTrigger aria-label="Filter by event type" className="h-9 px-3 text-xs w-[160px] sm:w-[180px] bg-background border-border">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            {dynamicEventTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" onClick={onReset} className="h-9 px-3 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw size={13} />
          <span>Reset</span>
        </Button>

        <Button variant="secondary" size="sm" onClick={onRefresh} className="h-9 px-3 gap-1.5 text-xs">
          <RefreshCw size={13} />
          <span>Refresh</span>
        </Button>
      </div>
    </div>
  );
}
