import React from "react";
import RateBar from "@/components/teacher/RateBar";
import type { StudentAttendanceRow } from "@/types";

export interface StudentTableRow extends StudentAttendanceRow {
  label?: string;
}

interface StudentTableProps {
  rows: StudentTableRow[];
  threshold: number;
  showClass?: boolean;
  emptyMessage: string;
}

export default function StudentTable({ rows, threshold, showClass = false, emptyMessage }: StudentTableProps): React.ReactElement {
  if (rows.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary/60 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-semibold">Student / Roll no.</th>
            {showClass && <th className="px-4 py-2.5 font-semibold">Class</th>}
            <th className="px-4 py-2.5 text-right font-semibold">Attended</th>
            <th className="w-56 px-4 py-2.5 font-semibold">Attendance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={`${row.label ?? ""}${row.student_id}`}>
              <td className="px-4 py-3">
                <span className="font-medium text-foreground">{row.student_name}</span>
                <span className="block font-mono text-xs text-muted-foreground">{row.enrollment_number}</span>
              </td>
              {showClass && <td className="px-4 py-3 text-xs text-muted-foreground">{row.label}</td>}
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{row.attended} of {row.held} lectures</td>
              <td className="px-4 py-3"><RateBar value={row.percentage} threshold={threshold} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
