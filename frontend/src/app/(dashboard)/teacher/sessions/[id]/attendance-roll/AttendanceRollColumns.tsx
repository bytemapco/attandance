import React from "react";
import type { TableColumn } from "@/components/ui/GlassTable";
import type { SessionStudentAttendanceItem } from "@/types";

interface GetAttendanceRollColumnsProps {
  onOverride: (studentId: string, status: string) => void;
}

export function getAttendanceRollColumns({
  onOverride,
}: GetAttendanceRollColumnsProps): TableColumn<SessionStudentAttendanceItem & Record<string, unknown>>[] {
  return [
    {
      key: "display_index",
      header: "#",
      render: (r) => (
        <span className="font-mono text-xs text-[#718087] font-medium">
          {String(r.display_index ?? "—")}
        </span>
      ),
    },
    {
      key: "enrollment_number",
      header: "Enrollment #",
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-[#202b30] bg-[#eeece7] px-2 py-0.5 rounded border border-[#e3e1dc]">
          {String(r.enrollment_number || "—")}
        </span>
      ),
    },
    {
      key: "full_name",
      header: "Student",
      sortable: true,
      render: (r) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[#202b30] text-sm">{String(r.full_name)}</span>
          {Boolean(r.email) && (
            <span className="text-[11px] text-[#526f78] font-mono">{String(r.email)}</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => {
        const status = String(r.status);
        if (status === "Present" || status === "Approved") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f3ed] text-[#247653] border border-[#247653]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#247653]" />
              Present
            </span>
          );
        }
        if (status === "Flagged") {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fbf1df] text-[#8a5b12] border border-[#8a5b12]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8a5b12]" />
              Flagged
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f9eaea] text-[#b54242] border border-[#b54242]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b54242]" />
            Absent
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Mark P / A",
      render: (row) => {
        const isPresent = row.status === "Present" || row.status === "Approved";
        const isAbsent = row.status === "Absent";
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="Mark Present"
              onClick={() => onOverride(String(row.student_id), "Present")}
              className={`w-7 h-7 rounded text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                isPresent
                  ? "bg-[#247653] text-white shadow-2xs scale-105"
                  : "bg-card text-[#526f78] border border-[#e3e1dc] hover:bg-[#e8f3ed] hover:text-[#247653] hover:border-[#247653]/40"
              }`}
            >
              P
            </button>
            <button
              type="button"
              title="Mark Absent"
              onClick={() => onOverride(String(row.student_id), "Absent")}
              className={`w-7 h-7 rounded text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                isAbsent
                  ? "bg-[#b54242] text-white shadow-2xs scale-105"
                  : "bg-card text-[#526f78] border border-[#e3e1dc] hover:bg-[#f9eaea] hover:text-[#b54242] hover:border-[#b54242]/40"
              }`}
            >
              A
            </button>
          </div>
        );
      },
    },
    {
      key: "final_score",
      header: "AI Score",
      render: (r) => {
        const score = Number(r.final_score);
        if (score === 0 && r.status === "Absent") return <span className="text-[#718087]">—</span>;
        return (
          <span className={`font-mono text-xs font-semibold ${score >= 0.75 ? "text-[#247653]" : "text-[#8a5b12]"}`}>
            {(score * 100).toFixed(1)}%
          </span>
        );
      },
    },
    {
      key: "marked_at",
      header: "Marked Time",
      render: (r) => (
        <span className="text-xs text-[#526f78] font-mono">
          {r.marked_at ? new Date(String(r.marked_at)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
        </span>
      ),
    },
  ];
}

export const getRosterColumns = getAttendanceRollColumns;
