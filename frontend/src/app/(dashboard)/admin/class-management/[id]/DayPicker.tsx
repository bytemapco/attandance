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
      <legend className="text-xs font-semibold text-foreground sm:text-sm">Days</legend>
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
              className={`h-9 min-w-12 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong ${
                on ? "border-primary bg-primary text-primary-foreground" : "border-border-strong bg-card text-foreground hover:bg-secondary"
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
