"use client";

import React from "react";
import { Calendar, Clock, X } from "lucide-react";

export type TimeRangePreset = "ALL" | "15M" | "1H" | "6H" | "24H" | "CUSTOM";

interface TimePresetFilterProps {
  selectedPreset: TimeRangePreset;
  onPresetChange: (preset: TimeRangePreset) => void;
  startDate: string;
  endDate: string;
  onDateRangeChange: (start: string, end: string) => void;
  onReset: () => void;
}

const PRESETS: { id: TimeRangePreset; label: string }[] = [
  { id: "ALL", label: "All Time" },
  { id: "15M", label: "Past 15m" },
  { id: "1H", label: "Past 1h" },
  { id: "6H", label: "Past 6h" },
  { id: "24H", label: "Past 24h" },
];

export default function TimePresetFilter({
  selectedPreset,
  onPresetChange,
  startDate,
  endDate,
  onDateRangeChange,
  onReset,
}: TimePresetFilterProps): React.ReactElement {
  const hasActiveFilter = selectedPreset !== "ALL" || Boolean(startDate || endDate);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-border/50 text-xs">
      {/* Relative Minute/Hour Time Presets */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="flex items-center gap-1 text-muted-foreground mr-1">
          <Clock size={12} className="text-primary/70" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Time Window:</span>
        </div>

        <div className="flex items-center gap-1 bg-secondary/40 p-0.5 rounded-lg border border-border/50">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onPresetChange(p.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                selectedPreset === p.id && !startDate && !endDate
                  ? "bg-card text-foreground font-semibold border border-border shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Always Visible Calendar Date Picker */}
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl px-2.5 py-1 shadow-2xs">
          <Calendar size={13} className="text-muted-foreground shrink-0" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => onDateRangeChange(e.target.value, endDate)}
            className="bg-transparent text-xs text-foreground focus:outline-hidden cursor-pointer"
            title="Start Date"
            aria-label="Filter Start Date"
          />
          <span className="text-muted-foreground text-xs font-mono">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onDateRangeChange(startDate, e.target.value)}
            className="bg-transparent text-xs text-foreground focus:outline-hidden cursor-pointer"
            title="End Date"
            aria-label="Filter End Date"
          />
        </div>

        {hasActiveFilter && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors px-1.5 py-1 rounded-md hover:bg-destructive/10 cursor-pointer"
            title="Clear all time & date filters"
          >
            <X size={11} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
