import React from "react";
import { WEEKDAYS } from "./weekdays";

interface DayPickerProps {
  /** Selected days, 1 = Monday to 7 = Sunday. */
  value: number[];
  onChange: (days: number[]) => void;
}

/** Toggle buttons for the days a subject meets. Several days can share one time. */
export default function DayPicker({ value, onChange }: DayPickerProps): React.ReactElement {
  function toggle(day: number): void {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b));
  }
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-xs font-semibold text-[#202b30] sm:text-sm">Days</legend>
      <div className="flex flex-wrap gap-1.5">
        {WEEKDAYS.map((label, index) => {
          const day = index + 1;
          const on = value.includes(day);
          return (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(day)}
              className={`h-9 min-w-12 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a4d30] ${
                on ? "border-[#28363b] bg-[#28363b] text-white" : "border-[#d9d5cd] bg-white text-[#202b30] hover:bg-[#f5f3ee]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
