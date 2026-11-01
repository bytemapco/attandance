import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthYearLabel(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(isoDate ?? "");
  const month = match ? MONTH_NAMES[Number(match[2]) - 1] : undefined;
  return match && month ? `${month} ${match[1]}` : "";
}

export function formatAcademicYearName(startDate: string, endDate: string): string {
  const start = monthYearLabel(startDate);
  const end = monthYearLabel(endDate);
  if (!start || !end) return "";
  return start === end ? start : `${start} – ${end}`;
}
