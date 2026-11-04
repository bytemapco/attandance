import React from "react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/reports";
import RateBar from "@/components/teacher/RateBar";
import type { SummaryReport } from "@/types";

export default function SummaryTable({ report }: { report: SummaryReport }): React.ReactElement {
  const { subjects, rows, meta } = report;
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/60 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Student / Roll no.</th>
              {subjects.map((subject) => (
                <th key={subject.section_id} className="px-3 py-2.5 text-center font-semibold" title={subject.subject_name}>
                  {subject.subject_code}
                </th>
              ))}
              <th className="w-52 px-4 py-2.5 font-semibold">Overall</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.student_id}>
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground">{row.student_name}</span>
                  <span className="block font-mono text-xs text-muted-foreground">{row.roll}</span>
                </td>
                {row.cells.map((cell, index) => (
                  <td
                    key={subjects[index].section_id}
                    className={cn(
                      "px-3 py-3 text-center tabular-nums",
                      cell?.percentage !== null && cell?.percentage !== undefined && cell.percentage < meta.threshold
                        ? "font-semibold text-destructive"
                        : "text-foreground"
                    )}
                    title={cell ? `${cell.attended} of ${cell.held} classes` : "Not in this subject"}
                  >
                    {cell ? formatPercent(cell.percentage) : "—"}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <RateBar value={row.overall.percentage} threshold={meta.threshold} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
