/** Date helpers for the teacher's timetable. Dates are "YYYY-MM-DD". Weeks run Monday to Sunday. */

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Today's date in the browser's time zone, as "YYYY-MM-DD". */
export function todayIso(now: Date = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function toUtcMs(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

/** Whether the text is a real calendar date such as "2026-11-02". */
export function isValidDay(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(toUtcMs(iso)) && new Date(toUtcMs(iso)).toISOString().slice(0, 10) === iso;
}

/** Shifts a date by a number of days. */
export function shiftDays(iso: string, days: number): string {
  return new Date(toUtcMs(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** A row's date as "YYYY-MM-DD". The API sends a timestamp, so only the day part is kept. */
export function dayOf(value: string): string {
  return value.slice(0, 10);
}

/** The Monday that starts the week containing `iso`. */
export function weekStart(iso: string): string {
  const weekday = new Date(toUtcMs(iso)).getUTCDay();
  return shiftDays(iso, -((weekday + 6) % 7));
}

/** The seven days of the week that starts on `monday`, Monday first. */
export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, offset) => shiftDays(monday, offset));
}

/** "Mon" for a date. */
export function weekdayName(iso: string): string {
  return WEEKDAYS[new Date(toUtcMs(iso)).getUTCDay()];
}

/** The day of the month, as a number. */
export function dayNumber(iso: string): number {
  return new Date(toUtcMs(iso)).getUTCDate();
}

/** The week's range, such as "2 Nov – 8 Nov 2026". `monday` must be the week's first day. */
export function formatWeekRange(monday: string): string {
  const start = new Date(toUtcMs(monday));
  const end = new Date(toUtcMs(shiftDays(monday, 6)));
  return `${start.getUTCDate()} ${MONTHS[start.getUTCMonth()]} – ${end.getUTCDate()} ${MONTHS[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
}
