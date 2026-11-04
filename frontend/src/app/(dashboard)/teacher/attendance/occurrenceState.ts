import type { BadgeVariant } from "@/components/ui/Badge";

export type OccurrenceState = "NOT_STARTED" | "LIVE" | "COMPLETED" | "CANCELLED";

interface StateInput {
  status: string;
  is_attendance_locked: boolean;
  verification_active: boolean;
  verification_expires?: string | null;
}

export function occurrenceState(item: StateInput, now: number = Date.now()): OccurrenceState {
  if (item.status === "CANCELLED") return "CANCELLED";
  if (item.is_attendance_locked) return "COMPLETED";
  const expires = item.verification_expires ? new Date(item.verification_expires).getTime() : 0;
  return item.verification_active && expires > now ? "LIVE" : "NOT_STARTED";
}

export const STATE_LABEL: Record<OccurrenceState, string> = {
  NOT_STARTED: "Not started",
  LIVE: "Live",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const STATE_BADGE: Record<OccurrenceState, BadgeVariant> = {
  NOT_STARTED: "neutral",
  LIVE: "success",
  COMPLETED: "info",
  CANCELLED: "danger",
};
