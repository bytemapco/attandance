import React from "react";
import { cn } from "@/lib/utils";
import RateBar from "@/components/teacher/RateBar";
import type { ClassAnalytics } from "@/types";

interface ClassCardProps {
  item: ClassAnalytics;
  selected: boolean;
  onSelect: () => void;
}

export default function ClassCard({ item, selected, onSelect }: ClassCardProps): React.ReactElement {
  const atRisk = item.below_threshold.length;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-3 rounded-[14px] border bg-card p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526f78]",
        selected ? "border-[#526f78] ring-1 ring-[#526f78]" : "border-border hover:border-[#526f78]/50"
      )}
    >
      <div>
        <p className="font-semibold text-foreground">{item.class_code}</p>
        <p className="text-xs text-muted-foreground">{item.subject_name}</p>
      </div>
      <RateBar value={item.average_percentage} threshold={item.threshold} />
      <p className="flex justify-between text-xs text-muted-foreground">
        <span>{item.student_count} students · {item.sessions_held} lectures</span>
        <span className={atRisk > 0 ? "font-semibold text-[#b54242]" : undefined}>
          {atRisk > 0 ? `${atRisk} in shortage` : "No shortage"}
        </span>
      </p>
    </button>
  );
}
