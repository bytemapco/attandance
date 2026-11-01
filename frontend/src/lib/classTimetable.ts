/** Pixels per hour in the class timetable. */
export const HOUR_PX = 56;

const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 17;

export interface TimedEntry {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export function toMinutes(clock: string): number {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
}

export function toClock(minutes: number): string {
  const clamped = Math.min(Math.max(minutes, 0), 23 * 60 + 59);
  const hours = String(Math.floor(clamped / 60)).padStart(2, "0");
  return `${hours}:${String(clamped % 60).padStart(2, "0")}`;
}

/** First and last hour shown. 08:00–17:00 by default, wider when a class falls outside it. */
export function hourRange(entries: TimedEntry[]): { startHour: number; endHour: number } {
  let startHour = DEFAULT_START_HOUR;
  let endHour = DEFAULT_END_HOUR;
  for (const entry of entries) {
    startHour = Math.min(startHour, Math.floor(toMinutes(entry.start_time) / 60));
    endHour = Math.max(endHour, Math.ceil(toMinutes(entry.end_time) / 60));
  }
  return { startHour, endHour: Math.min(endHour, 24) };
}

/** Mon–Fri always; Saturday and Sunday only when they hold a class. */
export function visibleDays(entries: TimedEntry[]): number[] {
  const days = [1, 2, 3, 4, 5];
  if (entries.some((e) => e.day_of_week === 6)) days.push(6);
  if (entries.some((e) => e.day_of_week === 7)) days.push(7);
  return days;
}

/** Where a class block sits inside its day column. */
export function blockPosition(entry: TimedEntry, startHour: number): { top: number; height: number } {
  const top = ((toMinutes(entry.start_time) - startHour * 60) / 60) * HOUR_PX;
  const height = ((toMinutes(entry.end_time) - toMinutes(entry.start_time)) / 60) * HOUR_PX;
  return { top, height };
}
