const pad = (value: number): string => String(value).padStart(2, "0");

/** The value a datetime-local input takes: the date and time on the person's own clock, to the minute. */
export function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** What the input holds, as the moment it means (UTC), or undefined when it is empty or not a real date. */
export function fromLocalInput(local: string): string | undefined {
  const moment = new Date(local);
  return local && !Number.isNaN(moment.getTime()) ? moment.toISOString() : undefined;
}

/** A sensible first choice when someone picks "later": the next whole hour. */
export function nextHour(now: Date = new Date()): string {
  const next = new Date(now);
  next.setHours(now.getHours() + 1, 0, 0, 0);
  return next.toISOString();
}
