"use client";

import React, { useState } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import GlassCard from "@/components/ui/GlassCard";
import GlassBadge, { type BadgeVariant } from "@/components/ui/GlassBadge";
import type { AnomalyResult } from "@/types";

interface AnomalyCardProps {
  result: AnomalyResult;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getRiskLevel(score: number): {
  label: string;
  variant: BadgeVariant;
} {
  if (score > 0.25) return { label: "High Risk", variant: "danger" };
  if (score > 0.15) return { label: "Medium Risk", variant: "warning" };
  return { label: "Low Risk", variant: "neutral" };
}

export default function AnomalyCard({ result }: AnomalyCardProps): React.ReactElement {
  const [copied, setCopied] = useState<boolean>(false);
  const score = result.anomaly_score || 0;
  const risk = getRiskLevel(score);

  const breakdown = result.day_breakdown || {};
  const maxAbsenceOnAnyDay = Math.max(1, ...Object.values(breakdown));

  function handleCopyId(id: string): void {
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast.success("Student ID copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <GlassCard className="bg-card border-border/80 p-4 rounded-2xl flex flex-col justify-between hover:border-slate-300 transition-all duration-200 shadow-xs">
      <div className="space-y-3.5">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-foreground truncate">
              {result.student_name || "Unknown Student"}
            </h4>
            <span className="inline-block text-[11px] font-mono text-muted-foreground mt-0.5">
              PRN: {result.enrollment_number || "N/A"}
            </span>
          </div>
          <GlassBadge variant={risk.variant}>{risk.label}</GlassBadge>
        </div>

        {/* Pattern Notice */}
        {result.primary_pattern && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-medium">
            <AlertCircle size={13} className="shrink-0" />
            <span className="truncate">{result.primary_pattern}</span>
          </div>
        )}

        {/* Key Metrics Strip */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-secondary/60 border border-border/40">
            <span className="text-[10px] text-muted-foreground block font-medium">
              Total Absences
            </span>
            <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
              {result.total_absences ?? "—"}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-secondary/60 border border-border/40">
            <span className="text-[10px] text-muted-foreground block font-medium">
              Risk Score
            </span>
            <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
              {score.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Weekday Distribution Bar Chart */}
        {breakdown && Object.keys(breakdown).length > 0 && (
          <div className="pt-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
              <span className="font-medium">Absence by Weekday</span>
              <span>Peak: {maxAbsenceOnAnyDay}d</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => {
                const count = breakdown[day] || 0;
                const ratio = Math.min(100, Math.round((count / maxAbsenceOnAnyDay) * 100));
                const isPeak = count === maxAbsenceOnAnyDay && count > 0;

                return (
                  <div
                    key={day}
                    className={`flex flex-col items-center justify-between py-1.5 px-0.5 rounded-lg border text-center transition-colors ${
                      isPeak
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                        : "bg-secondary/40 border-border/30 text-muted-foreground"
                    }`}
                  >
                    <span className="text-[9px] font-semibold">{day}</span>
                    <span className="text-[10px] font-mono font-bold my-0.5">{count}</span>
                    <div className="w-full h-1 bg-secondary rounded-full overflow-hidden px-0.5">
                      <div
                        className={`h-full rounded-full ${isPeak ? "bg-amber-500" : "bg-muted-foreground/40"}`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Details & Action */}
      <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="font-mono truncate max-w-[170px]" title={result.student_id}>
          ID: {result.student_id}
        </span>
        <button
          type="button"
          onClick={() => handleCopyId(result.student_id)}
          className="flex items-center gap-1 py-1 px-2 text-xs font-medium rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Copy Student ID"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-500" />
              <span className="text-[11px] text-emerald-600 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span className="text-[11px]">Copy ID</span>
            </>
          )}
        </button>
      </div>
    </GlassCard>
  );
}
