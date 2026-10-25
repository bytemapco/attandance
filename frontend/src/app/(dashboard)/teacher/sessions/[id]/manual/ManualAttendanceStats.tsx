"use client";

import React from "react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
import { Search } from "lucide-react";

interface ManualAttendanceStatsProps {
  presentPercent: number;
  presentCount: number;
  absentCount: number;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onMarkAll: (status: "Present" | "Absent") => void;
  onReset: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
}

export default function ManualAttendanceStats({
  presentPercent,
  presentCount,
  absentCount,
  searchQuery,
  onSearchChange,
  onMarkAll,
  onReset,
  onSubmit,
  onCancel,
  submitting,
}: ManualAttendanceStatsProps): React.ReactElement {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (presentPercent / 100) * circumference;

  return (
    <div className="space-y-4 lg:sticky lg:top-4">
      <GlassCard className="p-5 space-y-4 bg-card">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
          Roster Health
        </h3>
        
        <div className="relative w-24 h-24 flex items-center justify-center mx-auto">
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-secondary fill-none"
              strokeWidth="5"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-emerald-600 fill-none transition-all duration-300 ease-out"
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="text-center">
            <span className="text-xl font-bold text-foreground">{presentPercent}%</span>
            <p className="text-[9px] text-muted-foreground font-semibold uppercase">Present</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
          <div className="text-center border-r border-border">
            <span className="text-muted-foreground block text-[10px]">Present</span>
            <span className="text-sm font-bold text-emerald-700">{presentCount}</span>
          </div>
          <div className="text-center">
            <span className="text-muted-foreground block text-[10px]">Absent</span>
            <span className="text-sm font-bold text-rose-700">{absentCount}</span>
          </div>
        </div>

        <div className="space-y-2.5 pt-3 border-t border-border">
          <div className="relative w-full">
            <GlassInput
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 text-xs py-1.5"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <div className="flex gap-1 justify-center">
            <GlassButton
              variant="secondary"
              size="sm"
              className="flex-1 text-[11px] px-1 font-medium"
              onClick={() => onMarkAll("Present")}
            >
              All Present
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="sm"
              className="flex-1 text-[11px] px-1 font-medium"
              onClick={() => onMarkAll("Absent")}
            >
              All Absent
            </GlassButton>
            <GlassButton
              variant="ghost"
              size="sm"
              className="flex-1 text-[11px] px-1 font-medium"
              onClick={onReset}
            >
              Reset
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-4 space-y-2 bg-card">
        <GlassButton
          variant="primary"
          className="w-full font-medium text-xs"
          loading={submitting}
          onClick={onSubmit}
        >
          Commit Attendance
        </GlassButton>
        <GlassButton
          variant="ghost"
          className="w-full text-xs"
          disabled={submitting}
          onClick={onCancel}
        >
          Cancel
        </GlassButton>
      </GlassCard>
    </div>
  );
}
