import React from "react";
import { cn } from "@/lib/utils";

interface RateBarProps {
  value?: number | null;
  threshold: number;
  className?: string;
}

function tone(value: number, threshold: number): string {
  if (value < threshold) return "bg-[#b54242]";
  if (value < threshold + 10) return "bg-[#c98a1e]";
  return "bg-[#247653]";
}

export default function RateBar({ value, threshold, className }: RateBarProps): React.ReactElement {
  if (value === null || value === undefined) {
    return <span className="text-xs text-muted-foreground">No data</span>;
  }
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary" role="presentation">
        <div className={cn("h-full rounded-full", tone(value, threshold))} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="w-12 text-right text-xs font-semibold tabular-nums text-foreground">{Math.round(value * 10) / 10}%</span>
    </div>
  );
}
