import React from "react";
import { Calendar, Eye, ClipboardList, BookOpen, Download } from "lucide-react";
import type { TableColumn } from "@/components/ui/GlassTable";

export interface SessionLogItem {
  id: string;
  academicClassId: string;
  class_name: string;
  subject: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface ColumnProps {
  onPreview: (id: string) => void;
  onRoster: (id: string) => void;
  onManual: (id: string) => void;
  onExport: (id: string, className: string, subject: string, startTime: string) => void;
  exportingId: string | null;
}

export function getSessionLogColumns({
  onPreview,
  onRoster,
  onManual,
  onExport,
  exportingId,
}: ColumnProps): TableColumn<SessionLogItem & Record<string, unknown>>[] {
  return [
    {
      key: "class_name",
      header: "Class Name",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-foreground">{String(row.class_name)}</p>
          <p className="text-[11px] text-muted-foreground font-mono">ID: {row.id.slice(0, 8)}...</p>
        </div>
      ),
    },
    { key: "subject", header: "Subject", sortable: true },
    {
      key: "startTime",
      header: "Session Window",
      render: (row) => (
        <div className="flex flex-col gap-0.5 text-xs text-foreground">
          <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <Calendar size={12} />
            {new Date(String(row.startTime)).toLocaleDateString()}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {new Date(String(row.startTime)).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} – {new Date(String(row.endTime)).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPreview(row.id)}
            className="glass-btn glass-btn-ghost glass-btn-sm flex items-center gap-1.5 text-[12px] text-primary hover:text-primary/80"
            title="Preview Attendance Sheet"
          >
            <Eye size={13} />
            Preview
          </button>
          <button
            onClick={() => onRoster(row.id)}
            className="glass-btn glass-btn-ghost glass-btn-sm flex items-center gap-1.5 text-[12px]"
            title="View Roster Details"
          >
            <ClipboardList size={13} className="text-muted-foreground" />
            Roster
          </button>
          <button
            onClick={() => onManual(row.id)}
            className="glass-btn glass-btn-ghost glass-btn-sm flex items-center gap-1.5 text-[12px]"
            title="Manual Attendance Override"
          >
            <BookOpen size={13} className="text-muted-foreground" />
            Manual
          </button>
          <button
            onClick={() => onExport(row.id, row.class_name, row.subject, row.startTime)}
            disabled={exportingId === row.id}
            className="glass-btn glass-btn-ghost glass-btn-sm flex items-center gap-1.5 text-[12px]"
            title="Export Attendance as CSV"
          >
            <Download size={13} className={exportingId === row.id ? "animate-bounce text-emerald-600" : "text-emerald-600"} />
            {exportingId === row.id ? "Exporting..." : "Export"}
          </button>
        </div>
      ),
    },
  ];
}
