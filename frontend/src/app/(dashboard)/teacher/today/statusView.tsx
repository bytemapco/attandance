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
  DONE: { label: "Done", card: "border-[#cfe5d8] bg-[#eef6f1]", tone: "text-[#1f5c42]" },
  LIVE: { label: "Live", card: "border-[#247653] bg-[#e3f1e9]", tone: "text-[#1f5c42]" },
  PENDING: { label: "Pending", card: "border-[#ecd39a] bg-[#fff6e5]", tone: "text-[#7a4f0c]" },
  UPCOMING: { label: "Upcoming", card: "border-[#e6e2da] bg-white", tone: "text-[#526f78]" },
  MISSED: { label: "Not taken", card: "border-[#efc4c4] bg-[#fbeeee]", tone: "text-[#a23838]" },
  CANCELLED: { label: "Cancelled", card: "border-[#e6e2da] bg-[#f5f3ee]", tone: "text-[#6b7479]" },
};

/** A drawn mark for a status. Decorative: the label next to it carries the meaning. */
export function StatusMark({ status }: { status: ClassStatus }): React.ReactElement {
  switch (status) {
    case "DONE":
      return <CheckCircle2 size={14} aria-hidden />;
    case "LIVE":
      return <span aria-hidden className="mx-0.5 h-2.5 w-2.5 rounded-full bg-[#247653] motion-safe:animate-pulse" />;
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
