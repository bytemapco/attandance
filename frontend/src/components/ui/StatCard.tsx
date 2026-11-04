"use client";

import React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import Card from "./Card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  accentColor?: string;
  subtext?: string;
  interactive?: boolean;
}

const iconColor: Record<string, string> = {
  copper: "text-accent-strong",
  mineral: "text-muted-foreground",
  carbon: "text-primary",
  blue: "text-info",
  emerald: "text-success",
  purple: "text-muted-foreground",
  amber: "text-warning",
  rose: "text-destructive",
};

export default function StatCard({
  icon,
  label,
  value,
  trend,
  trendUp = true,
  accentColor = "mineral",
  subtext,
  interactive = false,
}: StatCardProps): React.ReactElement {
  const TrendIcon = trendUp ? ArrowUp : ArrowDown;

  return (
    <Card hoverable={interactive} padding="none" className="h-full p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("shrink-0", iconColor[accentColor] ?? iconColor.mineral)} aria-hidden>
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {(trend || subtext) && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {trend && (
            <span className={cn("inline-flex items-center gap-0.5 font-medium tabular-nums", trendUp ? "text-success" : "text-destructive")}>
              <TrendIcon size={12} aria-hidden />
              {trend}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </Card>
  );
}
