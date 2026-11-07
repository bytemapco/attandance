"use client";

import React from "react";
import { fromLocalInput, nextHour, toLocalInput } from "@/lib/announcements/schedule";

interface ScheduleFieldProps {
  /** The moment to show it (ISO, UTC). Empty means send now. */
  value?: string | null;
  onChange: (publishAt: string | undefined) => void;
}

const BUTTON = "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer";
const ACTIVE = "bg-card text-primary border-accent ring-1 ring-accent";
const IDLE = "bg-background border-border text-muted-foreground hover:text-primary hover:bg-secondary";

export default function ScheduleField({ value, onChange }: ScheduleFieldProps): React.ReactElement {
  const later = Boolean(value);
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-muted-foreground mb-1">When</legend>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={!later} className={`${BUTTON} ${later ? IDLE : ACTIVE}`} onClick={() => onChange(undefined)}>
          Send now
        </button>
        <button type="button" aria-pressed={later} className={`${BUTTON} ${later ? ACTIVE : IDLE}`} onClick={() => onChange(value || nextHour())}>
          Schedule for later
        </button>
        {later && (
          <input
            type="datetime-local"
            aria-label="Send at"
            min={toLocalInput(new Date())}
            value={toLocalInput(new Date(value as string))}
            onChange={(e) => onChange(fromLocalInput(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          />
        )}
      </div>
      {later && <p className="text-xs text-muted-foreground">It shows up for people from that time, on their own screens.</p>}
    </fieldset>
  );
}
