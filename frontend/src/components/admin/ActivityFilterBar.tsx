"use client";

import React from "react";
import { Search, Filter, RefreshCw, Layers, Users, ShieldCheck, Settings, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import TimePresetFilter, { type TimeRangePreset } from "./TimePresetFilter";

export type ActivityCategory = "ALL" | "USERS" | "CLASSES" | "SECURITY" | "CONFIG";

interface ActivityFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: ActivityCategory;
  onCategoryChange: (cat: ActivityCategory) => void;
  selectedSeverity: string;
  onSeverityChange: (sev: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  selectedTimePreset: TimeRangePreset;
  onTimePresetChange: (preset: TimeRangePreset) => void;
  startDate: string;
  endDate: string;
  onDateRangeChange: (start: string, end: string) => void;
  onResetTimeFilter: () => void;
}

const CATEGORIES: { id: ActivityCategory; label: string; icon: React.ReactNode }[] = [
  { id: "ALL", label: "All Events", icon: <Sparkles size={13} /> },
  { id: "USERS", label: "User Roster", icon: <Users size={13} /> },
  { id: "CLASSES", label: "Classrooms", icon: <Layers size={13} /> },
  { id: "SECURITY", label: "Security & Auth", icon: <ShieldCheck size={13} /> },
  { id: "CONFIG", label: "Settings", icon: <Settings size={13} /> },
];

export default function ActivityFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedSeverity,
  onSeverityChange,
  onRefresh,
  isRefreshing = false,
  selectedTimePreset,
  onTimePresetChange,
  startDate,
  endDate,
  onDateRangeChange,
  onResetTimeFilter,
}: ActivityFilterBarProps): React.ReactElement {
  return (
    <div className="space-y-3">
      {/* Top Filter & Action Strip */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search audit trail by event, actor, or payload..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
          />
        </div>

        {/* Right Controls: Severity Status & Refresh */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Select value={selectedSeverity || "all"} onValueChange={onSeverityChange}>
            <SelectTrigger className="h-9 min-w-[130px] rounded-xl border-border bg-card text-xs font-medium text-foreground shadow-2xs">
              <div className="flex items-center gap-1.5">
                <Filter size={13} className="text-muted-foreground" />
                <span>Status: {selectedSeverity === "all" ? "All" : selectedSeverity}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status: All</SelectItem>
              <SelectItem value="INFO">Info / Normal</SelectItem>
              <SelectItem value="WARNING">Warning</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High Severity</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={onRefresh}
            title="Refresh activity logs"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin text-primary" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Calendar & Time Filter Component */}
      <TimePresetFilter
        selectedPreset={selectedTimePreset}
        onPresetChange={onTimePresetChange}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
        onReset={onResetTimeFilter}
      />
    </div>
  );
}
