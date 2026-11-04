import React from "react";
import RateBar from "@/components/teacher/RateBar";
import type { ShortageReport } from "@/types";

function Stat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <dd className="text-2xl font-semibold tabular-nums text-foreground">{value}</dd>
      <dt className="text-xs text-muted-foreground">{label}</dt>
    </div>
  );
}

function needed(count?: number | null): string {
  if (count === null || count === undefined) return "Cannot reach the cut-off";
  return `${count} more ${count === 1 ? "class" : "classes"}, no absences`;
}

export default function ShortageTable({ report }: { report: ShortageReport }): React.ReactElement {
  const { meta, rows } = report;
  const average = report.average_percentage;
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Students counted" value={String(report.students_counted)} />
        <Stat label={`Below ${meta.threshold}%`} value={String(rows.length)} />
        <Stat label="Average attendance" value={average === null || average === undefined ? "—" : `${average}%`} />
      </dl>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No student is below {meta.threshold}% for this selection.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Student / Roll no.</th>
                  <th className="px-4 py-2.5 font-semibold">Class</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Attended</th>
                  <th className="w-56 px-4 py-2.5 font-semibold">Attendance</th>
                  <th className="px-4 py-2.5 font-semibold">To reach {meta.threshold}%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.student_id}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-foreground">{row.student_name}</span>
                      <span className="block font-mono text-xs text-muted-foreground">{row.roll}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row.class_code}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {row.attended} of {row.held}
                    </td>
                    <td className="px-4 py-3">
                      <RateBar value={row.percentage} threshold={meta.threshold} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{needed(row.classes_needed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
