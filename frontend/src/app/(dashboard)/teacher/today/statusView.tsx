import React from "react";
import { AlertCircle, Ban, CheckCircle2, Circle, Clock } from "lucide-react";
import type { ClassStatus } from "@/lib/teacher/classStatus";

export interface StatusView {
  label: string;
  /** Card fill and border. */
  card: string;
  /** Status text and icon color, on that fill. */
  tone: string;
}

/** The one place where a status gets its look, so a card and the summary strip always agree. */
export const STATUS_VIEW: Record<ClassStatus, StatusView> = {
  DONE: { label: "Done", card: "border-success-border bg-success-soft", tone: "text-success" },
  LIVE: { label: "Live", card: "border-success bg-success-soft", tone: "text-success" },
  PENDING: { label: "Pending", card: "border-warning-border bg-warning-soft", tone: "text-warning" },
  UPCOMING: { label: "Upcoming", card: "border-border bg-card", tone: "text-muted-foreground" },
  MISSED: { label: "Not taken", card: "border-destructive-border bg-destructive-soft", tone: "text-destructive-hover" },
  CANCELLED: { label: "Cancelled", card: "border-border bg-secondary", tone: "text-muted-foreground" },
};

/** A drawn mark for a status. Decorative: the label next to it carries the meaning. */
export function StatusMark({ status }: { status: ClassStatus }): React.ReactElement {
  switch (status) {
    case "DONE":
      return <CheckCircle2 size={14} aria-hidden />;
    case "LIVE":
      return <span aria-hidden className="mx-0.5 h-2.5 w-2.5 rounded-full bg-success motion-safe:animate-pulse" />;
    case "PENDING":
      return <Clock size={14} aria-hidden />;
    case "MISSED":
      return <AlertCircle size={14} aria-hidden />;
    case "CANCELLED":
      return <Ban size={14} aria-hidden />;
    default:
      return <Circle size={14} aria-hidden />;
  }
}
