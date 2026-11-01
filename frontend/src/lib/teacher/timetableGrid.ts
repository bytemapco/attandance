import { dayOf } from "./weekDates";

export interface TimetableRow<T> {
  start: string;
  end: string;
  /** The classes in this time slot, keyed by "YYYY-MM-DD". */
  byDay: Record<string, T[]>;
}

export interface TimetableGrid<T> {
  /** The columns to show: Monday to Friday, plus Saturday and Sunday only when they have a class. */
  days: string[];
  /** One row per time slot, earliest first. */
  rows: TimetableRow<T>[];
}

interface TimedRow {
  date: string;
  start_time: string;
  end_time: string;
}

/** Lays a week of classes out as a grid: time slots down the side, weekdays across the top. */
export function buildTimetable<T extends TimedRow>(week: string[], classes: T[]): TimetableGrid<T> {
  const used = new Set(classes.map((row) => dayOf(row.date)));
  const days = week.filter((day, index) => index < 5 || used.has(day));

  const slots = new Map<string, TimetableRow<T>>();
  for (const row of classes) {
    const day = dayOf(row.date);
    if (!days.includes(day)) continue;
    const key = `${row.start_time}-${row.end_time}`;
    let slot = slots.get(key);
    if (!slot) {
      slot = { start: row.start_time, end: row.end_time, byDay: {} };
      slots.set(key, slot);
    }
    slot.byDay[day] = [...(slot.byDay[day] ?? []), row];
  }

  const rows = [...slots.values()].sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
  return { days, rows };
}
