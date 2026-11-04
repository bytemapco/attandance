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

const colorStyles: Record<string, { icon: string; border: string }> = {
  copper: {
    icon: "text-accent-strong bg-accent-soft border-accent-border",
    border: "hover:border-accent/60",
  },
  mineral: {
    icon: "text-muted-foreground bg-secondary border-border",
    border: "hover:border-muted-foreground/60",
  },
  carbon: {
    icon: "text-primary bg-secondary border-border",
    border: "hover:border-primary/60",
  },
  blue: {
    icon: "text-info bg-info-soft border-info-border",
    border: "hover:border-info/40",
  },
  emerald: {
    icon: "text-success bg-success-soft border-success-border",
    border: "hover:border-success/40",
  },
  purple: {
    icon: "text-muted-foreground bg-secondary border-border",
    border: "hover:border-muted-foreground/40",
  },
  amber: {
    icon: "text-warning bg-warning-soft border-warning-border",
    border: "hover:border-warning/40",
  },
  rose: {
    icon: "text-destructive bg-destructive-soft border-destructive-border",
    border: "hover:border-destructive/40",
  },
};

export default function GlassStatCard({
  icon,
  label,
  value,
  trend,
  trendUp = true,
  accentColor = "mineral",
  subtext,
}: GlassStatCardProps): React.ReactElement {
  const theme = colorStyles[accentColor] || colorStyles.mineral;

  return (
    <GlassCard
      hoverable
      padding="none"
      className={cn(
        "relative overflow-hidden bg-card border border-border transition-all duration-200 p-5 group",
        theme.border
      )}
    >
      <div className="flex items-center justify-between mb-3.5 relative">
        <div className={cn("p-2.5 rounded-lg border flex items-center justify-center shrink-0", theme.icon)}>
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              "text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 tabular-nums",
              trendUp
                ? "bg-success-soft text-success border-success-border"
                : "bg-destructive-soft text-destructive border-destructive-border"
            )}
          >
            <span>{trendUp ? "↑" : "↓"}</span>
            <span>{trend}</span>
          </span>
        )}
      </div>
      <div className="relative">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
          {label}
        </p>
        {subtext && (
          <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5 font-normal">
            <span className="w-1.5 h-1.5 rounded-full bg-border-strong inline-block" />
            <span>{subtext}</span>
          </p>
        )}
      </div>
    </GlassCard>
  );
}
