import React from "react";
import type { ClassStatus, StatusCounts } from "@/lib/teacher/classStatus";
import { STATUS_VIEW, StatusMark } from "./statusView";

/** The order the teacher cares about: what needs attention first. */
const ORDER: ClassStatus[] = ["LIVE", "PENDING", "MISSED", "DONE", "UPCOMING", "CANCELLED"];

/** How many classes are in each state this week. It also works as the key to the card styles. */
export default function StatusSummary({ counts }: { counts: StatusCounts }): React.ReactElement | null {
  const shown = ORDER.filter((status) => counts[status] > 0);
  if (shown.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Classes this week by status">
      {shown.map((status) => (
        <li
          key={status}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tabular-nums ${STATUS_VIEW[status].card} ${STATUS_VIEW[status].tone}`}
        >
          <StatusMark status={status} />
          {counts[status]} {STATUS_VIEW[status].label}
        </li>
      ))}
    </ul>
  );
}
