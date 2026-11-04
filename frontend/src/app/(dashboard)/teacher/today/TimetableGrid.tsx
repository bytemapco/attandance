import React from "react";
import { dayNumber, weekdayName } from "@/lib/teacher/weekDates";
import type { ClassStatus } from "@/lib/teacher/classStatus";
import type { TimetableGrid as Grid } from "@/lib/teacher/timetableGrid";
import type { DailyOccurrenceItem } from "@/types";
import ClassCard from "./ClassCard";

interface TimetableGridProps {
  grid: Grid<DailyOccurrenceItem>;
  today: string;
  /** The date picked in the filter. Its column is marked when it is not today. */
  selected: string;
  statusOf: (item: DailyOccurrenceItem) => ClassStatus;
  openingId: string | null;
  onActivate: (item: DailyOccurrenceItem) => void;
}

function DayHead({ day, today, selected }: { day: string; today: string; selected: string }): React.ReactElement {
  const isToday = day === today;
  const mark = isToday
    ? "bg-accent-strong text-primary-foreground"
    : day === selected
      ? "ring-1 ring-accent-strong text-accent-strong"
      : "text-foreground";
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{weekdayName(day)}</span>
      <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold tabular-nums ${mark}`}>
        {dayNumber(day)}
        {isToday && <span className="sr-only"> (today)</span>}
      </span>
    </span>
  );
}

/** Time slots down the side, weekdays across the top. The time column stays put while the grid scrolls. */
export default function TimetableGrid({ grid, today, selected, statusOf, openingId, onActivate }: TimetableGridProps): React.ReactElement {
  return (
    <div className="overflow-x-auto rounded-xl border border-border-strong bg-card">
      <table className="w-full min-w-[44rem] border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th scope="col" className="sticky left-0 z-10 w-24 bg-surface px-3 py-3 text-left text-xs font-medium text-muted-foreground">
              Time
            </th>
            {grid.days.map((day) => (
              <th key={day} scope="col" className="min-w-[8.5rem] px-2 py-3 text-left">
                <DayHead day={day} today={today} selected={selected} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row) => (
            <tr key={`${row.start}-${row.end}`} className="border-b border-border last:border-b-0">
              <th scope="row" className="sticky left-0 z-10 bg-card px-3 py-3 text-left align-top text-xs font-semibold tabular-nums text-foreground">
                {row.start}
                <span className="block font-normal text-muted-foreground">{row.end}</span>
              </th>
              {grid.days.map((day) => (
                <td key={day} className={`px-2 pb-0 pt-2 align-top ${day === today ? "bg-surface" : ""}`}>
                  {(row.byDay[day] ?? []).map((item) => (
                    <ClassCard
                      key={item.id}
                      item={item}
                      status={statusOf(item)}
                      busy={openingId === item.id}
                      onActivate={onActivate}
                    />
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
