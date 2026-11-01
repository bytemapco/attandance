import React from "react";
import { classAction, type ClassStatus } from "@/lib/teacher/classStatus";
import type { DailyOccurrenceItem } from "@/types";
import { STATUS_VIEW, StatusMark } from "./statusView";

interface ClassCardProps {
  item: DailyOccurrenceItem;
  status: ClassStatus;
  /** True while attendance is being started for this class. */
  busy: boolean;
  onActivate: (item: DailyOccurrenceItem) => void;
}

/** What the status line says. A finished class also shows how many students were present. */
function statusText(item: DailyOccurrenceItem, status: ClassStatus, busy: boolean): string {
  if (busy) return "Starting…";
  const label = STATUS_VIEW[status].label;
  return status === "DONE" ? `${label} · ${item.present_count}/${item.total_enrolled}` : label;
}

function accessibleName(item: DailyOccurrenceItem, status: ClassStatus): string {
  const base = `${item.subject_code || item.course_name}, ${item.section_name}, ${item.start_time} to ${item.end_time}, ${STATUS_VIEW[status].label}`;
  return status === "DONE" ? `${base}, ${item.present_count} of ${item.total_enrolled} present` : base;
}

export default function ClassCard({ item, status, busy, onActivate }: ClassCardProps): React.ReactElement {
  const view = STATUS_VIEW[status];
  const interactive = classAction(status) !== "none";
  const cancelled = status === "CANCELLED";
  const body = (
    <>
      <span className={`block truncate text-sm font-semibold ${cancelled ? "text-[#6b7479] line-through" : "text-[#202b30]"}`}>
        {item.subject_code || item.course_name}
      </span>
      <span className="mt-0.5 block truncate text-xs text-[#526f78]">
        {item.section_name} · {item.classroom_name}
      </span>
      <span className={`mt-2 flex items-center gap-1.5 text-xs font-semibold tabular-nums ${view.tone}`}>
        <StatusMark status={status} />
        {statusText(item, status, busy)}
      </span>
    </>
  );
  const shape = `mb-2 block w-full rounded-lg border px-3 py-2.5 text-left ${view.card}`;

  if (!interactive) {
    return (
      <div className={shape} title={item.course_name} aria-label={accessibleName(item, status)} role="group">
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      title={item.course_name}
      aria-label={accessibleName(item, status)}
      onClick={() => onActivate(item)}
      className={`${shape} transition-colors hover:border-[#8a4d30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8a4d30] disabled:cursor-wait`}
    >
      {body}
    </button>
  );
}
