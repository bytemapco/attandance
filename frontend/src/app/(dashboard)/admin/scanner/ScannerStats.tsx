"use client";

import React from "react";
import { Search, X, Users, AlertTriangle, Activity, ArrowUpDown } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

interface ScannerStatsProps {
  totalFlagged: number;
  avgScore: number;
  maxScore: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: "score" | "absences" | "name";
  onSortChange: (value: "score" | "absences" | "name") => void;
}

export default function ScannerStats({
  totalFlagged,
  avgScore,
  maxScore,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
}: ScannerStatsProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Flagged Count */}
        <GlassCard className="p-4 bg-card/80 border-border/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground">Flagged Students</span>
            <p className="text-2xl font-semibold tracking-tight text-foreground mt-0.5 font-mono">
              {totalFlagged}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-600 border border-red-500/20">
            <Users size={18} />
          </span>
        </GlassCard>

        {/* Avg Score */}
        <GlassCard className="p-4 bg-card/80 border-border/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground">Average Score</span>
            <p className="text-2xl font-semibold tracking-tight text-foreground mt-0.5 font-mono">
              {avgScore.toFixed(3)}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Activity size={18} />
          </span>
        </GlassCard>

        {/* Max Score */}
        <GlassCard className="p-4 bg-card/80 border-border/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-muted-foreground">Highest Score</span>
            <p className="text-2xl font-semibold tracking-tight text-foreground mt-0.5 font-mono">
              {maxScore.toFixed(3)}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
            <AlertTriangle size={18} />
          </span>
        </GlassCard>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-8 text-xs bg-card border border-border/80 rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <ArrowUpDown size={13} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Sort:</span>
          <select
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onSortChange(e.target.value as "score" | "absences" | "name")
            }
            className="h-9 text-xs bg-card border border-border/80 rounded-xl px-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="score">Highest Risk</option>
            <option value="absences">Most Absences</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>
    </div>
  );
}
