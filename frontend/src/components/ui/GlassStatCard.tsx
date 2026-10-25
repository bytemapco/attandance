"use client";

import React from "react";
import GlassCard from "./GlassCard";
import { cn } from "@/lib/utils";

export interface GlassStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  accentColor?: string;
  subtext?: string;
}

const colorStyles: Record<string, { icon: string; border: string; glow: string }> = {
  blue: {
    icon: "text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400",
    border: "hover:border-blue-500/30",
    glow: "from-blue-500/5",
  },
  emerald: {
    icon: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400",
    border: "hover:border-emerald-500/30",
    glow: "from-emerald-500/5",
  },
  purple: {
    icon: "text-purple-600 bg-purple-500/10 border-purple-500/20 dark:text-purple-400",
    border: "hover:border-purple-500/30",
    glow: "from-purple-500/5",
  },
  amber: {
    icon: "text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400",
    border: "hover:border-amber-500/30",
    glow: "from-amber-500/5",
  },
  rose: {
    icon: "text-rose-600 bg-rose-500/10 border-rose-500/20 dark:text-rose-400",
    border: "hover:border-rose-500/30",
    glow: "from-rose-500/5",
  },
};

export default function GlassStatCard({
  icon,
  label,
  value,
  trend,
  trendUp = true,
  accentColor = "blue",
  subtext,
}: GlassStatCardProps): React.ReactElement {
  const theme = colorStyles[accentColor] || colorStyles.blue;

  return (
    <GlassCard
      hoverable
      padding="none"
      className={cn(
        "relative overflow-hidden bg-card border border-border transition-all duration-200 p-5 shadow-xs group",
        theme.border
      )}
    >
      <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br to-transparent pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity", theme.glow)} />
      <div className="flex items-center justify-between mb-3.5 relative">
        <div className={cn("p-2.5 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs", theme.icon)}>
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 shadow-2xs",
              trendUp
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
            )}
          >
            <span>{trendUp ? "↑" : "↓"}</span>
            <span>{trend}</span>
          </span>
        )}
      </div>
      <div className="relative">
        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
          {label}
        </p>
        {subtext && (
          <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5 font-normal">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" />
            <span>{subtext}</span>
          </p>
        )}
      </div>
    </GlassCard>
  );
}
