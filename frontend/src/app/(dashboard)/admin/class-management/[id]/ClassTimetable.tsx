"use client";

import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import type { ClassDetail, ClassSectionItem } from "@/types";
import { blockPosition, HOUR_PX, hourRange, toClock, toMinutes, visibleDays, type TimedEntry } from "@/lib/classTimetable";
import SlotDialog from "./SlotDialog";
import type { SlotDraft } from "./slotSave";
import { WEEKDAYS } from "./weekdays";

interface ClassTimetableProps {
  cls: ClassDetail;
  onUpdated: (cls: ClassDetail) => void;
}

/** One tint per subject, so a subject is easy to follow across the week. */
const TINTS = [
  "border-accent-border bg-accent-soft text-accent-strong",
  "border-success-border bg-success-soft text-success",
  "border-info-border bg-info-soft text-info",
  "border-warning-border bg-warning-soft text-warning",
  "border-border-strong bg-secondary text-foreground",
];

interface Entry extends TimedEntry {
  ruleId: string;
  section: ClassSectionItem;
  room: string | null;
  tint: string;
}

function toEntries(sections: ClassSectionItem[]): Entry[] {
  return sections.flatMap((section, index) =>
    section.schedule.map((rule) => ({
      day_of_week: rule.day_of_week,
      start_time: rule.start_time,
      end_time: rule.end_time,
      ruleId: rule.id,
      section,
      room: rule.room_name ?? null,
      tint: TINTS[index % TINTS.length],
    }))
  );
}

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** The whole class week. Click an empty hour to add a class, or a block to change or remove it. */
export default function ClassTimetable({ cls, onUpdated }: ClassTimetableProps): React.ReactElement {
  const [draft, setDraft] = useState<SlotDraft | null>(null);
  const entries = useMemo(() => toEntries(cls.sections), [cls.sections]);
  const { startHour, endHour } = hourRange(entries);
  const days = visibleDays(entries);
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const unscheduled = cls.sections.filter((s) => s.schedule.length === 0);

  function addAt(day: number, hour: number, sectionId = ""): void {
    const start = toClock(hour * 60);
    setDraft({ sectionId, day, start, end: toClock(toMinutes(start) + 60) });
  }

  function change(entry: Entry): void {
    setDraft({
      sectionId: entry.section.id,
      day: entry.day_of_week,
      start: entry.start_time,
      end: entry.end_time,
      roomName: entry.room,
      ruleId: entry.ruleId,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <GlassButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => addAt(1, 9)}>
          Add class time
        </GlassButton>
        {unscheduled.length > 0 && <span className="text-sm text-muted-foreground">Not on the timetable:</span>}
        {unscheduled.map((s) => (
          <button
            key={s.id}
            type="button"
            title="Add class times"
            onClick={() => addAt(1, 9, s.id)}
            className="rounded-full border border-border-strong bg-card px-3 py-1 text-xs font-semibold text-foreground hover:bg-secondary"
          >
            {s.subject_name}
            {!s.teacher_id && " · no teacher"}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border-strong bg-card">
        <div className="grid min-w-[42rem]" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(7rem, 1fr))` }}>
          <div className="border-b border-border bg-surface" />
          {days.map((day) => (
            <div key={day} className="border-b border-l border-border bg-surface px-2 py-2.5 text-xs font-semibold text-foreground">
              {WEEKDAYS[day - 1]}
            </div>
          ))}

          <div className="relative" style={{ height: hours.length * HOUR_PX }}>
            {hours.map((hour, i) => (
              <span key={hour} className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground" style={{ top: i * HOUR_PX, display: i === 0 ? "none" : undefined }}>
                {hourLabel(hour)}
              </span>
            ))}
          </div>
          {days.map((day) => (
            <div key={day} className="relative border-l border-border" style={{ height: hours.length * HOUR_PX }}>
              {hours.map((hour) => (
                <button
                  key={hour}
                  type="button"
                  aria-label={`Add class on ${WEEKDAYS[day - 1]} at ${hourLabel(hour)}`}
                  onClick={() => addAt(day, hour)}
                  style={{ height: HOUR_PX }}
                  className="block w-full border-b border-secondary hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-strong"
                />
              ))}
              {entries
                .filter((e) => e.day_of_week === day)
                .map((entry) => {
                  const { top, height } = blockPosition(entry, startHour);
                  return (
                    <button
                      key={entry.ruleId}
                      type="button"
                      aria-label={`${entry.section.subject_name}, ${WEEKDAYS[day - 1]} ${entry.start_time} to ${entry.end_time}. Change`}
                      onClick={() => change(entry)}
                      style={{ top: top + 1, height: height - 2 }}
                      className={`absolute inset-x-1 overflow-hidden rounded-lg border px-2 py-1 text-left text-xs transition-shadow focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-strong ${entry.tint}`}
                    >
                      <span className="block truncate font-semibold">{entry.section.subject_code || entry.section.subject_name}</span>
                      <span className="block truncate tabular-nums opacity-80">
                        {entry.start_time}–{entry.end_time}
                      </span>
                      {height >= HOUR_PX && <span className="block truncate opacity-80">{[entry.room, entry.section.teacher_name].filter(Boolean).join(" · ")}</span>}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {draft && <SlotDialog cls={cls} draft={draft} onUpdated={onUpdated} onClose={() => setDraft(null)} />}
    </div>
  );
}
