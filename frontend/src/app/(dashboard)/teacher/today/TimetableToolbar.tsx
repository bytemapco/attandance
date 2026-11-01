import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatWeekRange } from "@/lib/teacher/weekDates";

interface TimetableToolbarProps {
  monday: string;
  selected: string;
  onSelect: (day: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

const BUTTON =
  "h-9 rounded-lg border border-[#d9d5cd] bg-white text-sm text-[#202b30] transition-colors hover:bg-[#f5f3ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a4d30]";

/** Date filter and week controls. Picking a date shows the week that holds it. */
export default function TimetableToolbar({ monday, selected, onSelect, onPreviousWeek, onNextWeek, onToday }: TimetableToolbarProps): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" aria-label="Previous week" onClick={onPreviousWeek} className={`${BUTTON} flex w-9 items-center justify-center`}>
        <ChevronLeft size={16} aria-hidden />
      </button>
      <button type="button" aria-label="Next week" onClick={onNextWeek} className={`${BUTTON} flex w-9 items-center justify-center`}>
        <ChevronRight size={16} aria-hidden />
      </button>
      <input
        type="date"
        aria-label="Go to date"
        value={selected}
        onChange={(event) => onSelect(event.target.value)}
        className={`${BUTTON} px-3 tabular-nums`}
      />
      <button type="button" onClick={onToday} className={`${BUTTON} px-3 font-medium`}>
        Today
      </button>
      <p className="ml-auto text-sm font-semibold tabular-nums text-[#202b30]">{formatWeekRange(monday)}</p>
    </div>
  );
}
