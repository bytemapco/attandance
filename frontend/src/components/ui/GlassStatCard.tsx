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
    icon: "text-[#c98260] bg-[#f7efea] border-[#f0ded4]",
    border: "hover:border-[#c98260]/60",
  },
  mineral: {
    icon: "text-[#526f78] bg-[#eeece7] border-[#e3e1dc]",
    border: "hover:border-[#526f78]/60",
  },
  carbon: {
    icon: "text-[#28363b] bg-[#eeece7] border-[#e3e1dc]",
    border: "hover:border-[#28363b]/60",
  },
  blue: {
    icon: "text-[#306b8a] bg-[#eaf2f6] border-[#c5dce8]",
    border: "hover:border-[#306b8a]/40",
  },
  emerald: {
    icon: "text-[#247653] bg-[#e8f3ed] border-[#c6e2d3]",
    border: "hover:border-[#247653]/40",
  },
  purple: {
    icon: "text-[#526f78] bg-[#eeece7] border-[#e3e1dc]",
    border: "hover:border-[#526f78]/40",
  },
  amber: {
    icon: "text-[#8a5b12] bg-[#fbf1df] border-[#f2deba]",
    border: "hover:border-[#8a5b12]/40",
  },
  rose: {
    icon: "text-[#b54242] bg-[#f9eaea] border-[#f0c9c9]",
    border: "hover:border-[#b54242]/40",
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
        "relative overflow-hidden bg-card border border-border transition-all duration-200 p-5 shadow-[0_2px_8px_rgba(40,54,59,0.05)] group",
        theme.border
      )}
    >
      <div className="flex items-center justify-between mb-3.5 relative">
        <div className={cn("p-2.5 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs", theme.icon)}>
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              "text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 shadow-2xs tabular-nums",
              trendUp
                ? "bg-[#e8f3ed] text-[#247653] border-[#c6e2d3]"
                : "bg-[#f9eaea] text-[#b54242] border-[#f0c9c9]"
            )}
          >
            <span>{trendUp ? "↑" : "↓"}</span>
            <span>{trend}</span>
          </span>
        )}
      </div>
      <div className="relative">
        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202b30] font-mono tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-semibold text-[#526f78] uppercase tracking-wider mt-1">
          {label}
        </p>
        {subtext && (
          <p className="text-[11px] text-[#718087] mt-1.5 flex items-center gap-1.5 font-normal">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4d0c8] inline-block" />
            <span>{subtext}</span>
          </p>
        )}
      </div>
    </GlassCard>
  );
}
