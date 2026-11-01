import { dayOf } from "./weekDates";

/**
 * Where a class stands for the teacher:
 * DONE      attendance was taken
 * LIVE      attendance is open right now
 * PENDING   it is today and attendance has not been started
 * UPCOMING  it is on a later day
 * MISSED    it was on an earlier day and attendance was never taken
 * CANCELLED the class did not run
 */
export type ClassStatus = "DONE" | "LIVE" | "PENDING" | "UPCOMING" | "MISSED" | "CANCELLED";

export interface StatusInput {
  date: string;
  status: string;
  is_attendance_locked: boolean;
  verification_active: boolean;
  verification_expires?: string | null;
}

function windowIsOpen(item: StatusInput, now: number): boolean {
  const expires = item.verification_expires ? new Date(item.verification_expires).getTime() : 0;
  return item.verification_active && expires > now;
}

export function classStatus(item: StatusInput, today: string, now: number = Date.now()): ClassStatus {
  if (item.status === "CANCELLED") return "CANCELLED";
  if (item.is_attendance_locked) return "DONE";
  if (windowIsOpen(item, now)) return "LIVE";
  // A class whose attendance was started is conducted, even if the window has closed.
  if (item.status === "CONDUCTED") return "DONE";
  const day = dayOf(item.date);
  if (day > today) return "UPCOMING";
  if (day === today) return "PENDING";
  return "MISSED";
}

/** What clicking a class does: start attendance, open its register, or nothing. A past class that was never taken stays closed. */
export type ClassAction = "start" | "open" | "none";

export function classAction(status: ClassStatus): ClassAction {
  if (status === "PENDING") return "start";
  if (status === "LIVE" || status === "DONE") return "open";
  return "none";
}

export type StatusCounts = Record<ClassStatus, number>;

export function countByStatus(items: StatusInput[], today: string, now: number = Date.now()): StatusCounts {
  const counts: StatusCounts = { DONE: 0, LIVE: 0, PENDING: 0, UPCOMING: 0, MISSED: 0, CANCELLED: 0 };
  for (const item of items) counts[classStatus(item, today, now)] += 1;
  return counts;
}
