import React from "react";
import { cn } from "@/lib/utils";
import { MARK_STYLE, formatDay, formatPercent } from "@/lib/reports";
import type { RegisterReport } from "@/types";

function Mark({ status }: { status: string | null }): React.ReactElement {
  if (status === null) return <span className="text-muted-foreground" title="Nothing recorded">?</span>;
  const style = MARK_STYLE[status];
  return (
    <span
      title={style?.label ?? status}
      className={cn("inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold", style?.className)}
    >
      {style?.code ?? "?"}
    </span>
  );
}

export default function RegisterTable({ report }: { report: RegisterReport }): React.ReactElement {
  const { lectures, rows, meta } = report;
  if (lectures.length === 0) {
    return (
      <p className="rounded-[14px] border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        No class has been closed in this date range.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        P present · L late · A absent · E excused · F flagged · – not yet enrolled · ? nothing recorded
      </p>
      <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-secondary/60 text-xs text-muted-foreground">
            <tr>
              <th className="sticky left-0 z-10 min-w-48 bg-secondary px-4 py-2.5 font-semibold">Student / Roll no.</th>
              {lectures.map((lecture) => (
                <th key={lecture.id} className="px-1.5 py-2.5 text-center font-semibold" title={`${lecture.start}–${lecture.end}`}>
                  <span className="block whitespace-nowrap">{formatDay(lecture.day)}</span>
                  <span className="block font-normal">{lecture.start}</span>
                </th>
              ))}
              <th className="px-3 py-2.5 text-right font-semibold">Attended</th>
              <th className="px-3 py-2.5 text-right font-semibold">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.student_id}>
                <td className="sticky left-0 z-10 bg-card px-4 py-2">
                  <span className="font-medium text-foreground">{row.student_name}</span>
                  <span className="block font-mono text-xs text-muted-foreground">{row.roll}</span>
                </td>
                {row.marks.map((status, index) => (
                  <td key={lectures[index].id} className="px-1.5 py-2 text-center">
                    <Mark status={status} />
                  </td>
                ))}
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                  {row.attended} of {row.held}
                </td>
                <td
                  className={cn(
                    "px-3 py-2 text-right font-semibold tabular-nums",
                    row.percentage !== null && row.percentage !== undefined && row.percentage < meta.threshold
                      ? "text-destructive"
                      : "text-foreground"
                  )}
                >
                  {formatPercent(row.percentage)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-border bg-secondary/40 text-xs text-muted-foreground">
            <tr>
              <th className="sticky left-0 bg-secondary px-4 py-2 text-left font-semibold">Present in class</th>
              {lectures.map((lecture) => (
                <td key={lecture.id} className="px-1.5 py-2 text-center tabular-nums">
                  {lecture.present}
                </td>
              ))}
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
