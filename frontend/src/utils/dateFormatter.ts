/**
 * Standard Indian Locale Date & Time Formatting Utilities
 * Locale: en-IN (Indian English)
 * Timezone: Asia/Kolkata (IST)
 */

const IST_TIMEZONE = "Asia/Kolkata";

function parseDateInput(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const parsed = typeof value === "string" ? new Date(value) : value;
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

/**
 * Standard DD/MM/YYYY Indian numeric format
 */
export function formatDateIndian(
  value: string | Date | null | undefined,
  fallback = "—"
): string {
  const date = parseDateInput(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: IST_TIMEZONE,
  }).format(date);
}

/**
 * Medium format: 15 Oct 2026
 */
export function formatDateIndianMedium(
  value: string | Date | null | undefined,
  fallback = "—"
): string {
  const date = parseDateInput(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: IST_TIMEZONE,
  }).format(date);
}

/**
 * DateTime format: 15 Oct 2026, 09:30 AM
 */
export function formatDateTimeIndian(
  value: string | Date | null | undefined,
  fallback = "—"
): string {
  const date = parseDateInput(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: IST_TIMEZONE,
  }).format(date);
}

/**
 * Time format: 09:30 AM
 */
export function formatTimeIndian(
  value: string | Date | null | undefined,
  fallback = "—"
): string {
  const date = parseDateInput(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: IST_TIMEZONE,
  }).format(date);
}
