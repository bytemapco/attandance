import React from "react";
import GlassBadge, { statusToBadgeVariant } from "@/components/ui/GlassBadge";
import type { TableColumn } from "@/components/ui/GlassTable";
import type { StudentRosterItem } from "@/types";

interface GetRosterColumnsProps {
  onOverride: (studentId: string, status: string) => void;
}

export function getRosterColumns({
  onOverride,
}: GetRosterColumnsProps): TableColumn<StudentRosterItem & Record<string, unknown>>[] {
  return [
    { key: "enrollment_number", header: "Enrollment #", sortable: true },
    { key: "full_name", header: "Full Name", sortable: true },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <GlassBadge variant={statusToBadgeVariant(String(r.status))}>
          {String(r.status)}
        </GlassBadge>
      ),
    },
    {
      key: "final_score",
      header: "AI Score",
      render: (r) => {
        const score = Number(r.final_score);
        if (score === 0 && r.status === "Absent") return <span className="text-muted-foreground">—</span>;
        return <span className="font-mono text-sm font-semibold text-foreground">{(score * 100).toFixed(1)}%</span>;
      },
    },
    {
      key: "marked_at",
      header: "Marked At",
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.marked_at ? new Date(String(r.marked_at)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Override",
      render: (row) => (
        <div className="flex gap-1.5">
          <button
            onClick={() => onOverride(String(row.student_id), "Present")}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors"
          >
            Present
          </button>
          <button
            onClick={() => onOverride(String(row.student_id), "Absent")}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors"
          >
            Absent
          </button>
        </div>
      ),
    },
  ];
}
