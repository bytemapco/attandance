import React from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import type { HistoryItem } from "@/types";

export default function SessionRow({ item }: { item: HistoryItem }): React.ReactElement {
  const rate = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
  return (
    <li>
      <Link
        href={`/teacher/attendance/${item.occurrence_id}`}
        className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-secondary/50 focus-visible:bg-secondary/50 focus-visible:outline-none sm:grid-cols-[7.5rem_1fr_11rem_auto]"
      >
        <span className="text-xs tabular-nums text-muted-foreground sm:text-sm">{item.time_range}</span>
        <span className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:row-start-auto">
          <span className="block truncate font-semibold text-foreground">{item.subject_name}</span>
          <span className="block text-xs text-muted-foreground">{item.class_code}</span>
        </span>
        <span className="col-start-2 row-start-1 flex items-center gap-2 justify-self-end sm:col-start-auto sm:row-start-auto sm:justify-self-stretch">
          <span className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-secondary sm:block" role="presentation">
            <span className="block h-full rounded-full bg-muted-foreground" style={{ width: `${rate}%` }} />
          </span>
          <span className="text-sm tabular-nums text-foreground">
            <span className="font-semibold">{item.present}</span>
            <span className="text-muted-foreground"> / {item.total}</span>
          </span>
        </span>
        <span className="col-span-2 flex flex-wrap items-center gap-1.5 sm:col-span-1 sm:justify-end">
          {item.locked ? <Badge variant="neutral">Submitted</Badge> : <Badge variant="success">In progress</Badge>}
          {item.flagged > 0 && <Badge variant="warning">{item.flagged} to verify</Badge>}
        </span>
      </Link>
    </li>
  );
}
