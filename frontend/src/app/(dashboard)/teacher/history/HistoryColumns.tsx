import React from "react";
import { Calendar, Eye, ClipboardList, BookOpen, Download } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import type { TableColumn } from "@/components/ui/GlassTable";
import { formatDateIndianMedium, formatTimeIndian } from "@/utils/dateFormatter";

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
      header: "Class",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-[#28363b]">{String(row.class_name)}</span>
      ),
    },
    { key: "subject", header: "Subject", sortable: true },
    {
      key: "startTime",
      header: "Date & Time",
      render: (row) => (
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="flex items-center gap-1.5 text-[#28363b] font-medium">
            <Calendar size={12} className="text-[#c98260]" />
            {formatDateIndianMedium(String(row.startTime))}
          </span>
          <span className="text-[11px] text-[#526f78]">
            {formatTimeIndian(String(row.startTime))} – {formatTimeIndian(String(row.endTime))}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onPreview(row.id)}
            className="text-xs h-7 px-2"
            icon={<Eye size={13} className="text-[#c98260]" />}
            title="Preview Attendance Sheet"
          >
            Preview
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onRoster(row.id)}
            className="text-xs h-7 px-2"
            icon={<ClipboardList size={13} className="text-[#526f78]" />}
            title="View Attendance Details"
          >
            Attendance
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onManual(row.id)}
            className="text-xs h-7 px-2"
            icon={<BookOpen size={13} className="text-[#526f78]" />}
            title="Manual Attendance Entry"
          >
            Manual Entry
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onExport(row.id, row.class_name, row.subject, row.startTime)}
            disabled={exportingId === row.id}
            className="text-xs h-7 px-2"
            icon={<Download size={13} className={exportingId === row.id ? "animate-bounce text-[#247653]" : "text-[#247653]"} />}
            title="Export Attendance CSV"
          >
            {exportingId === row.id ? "Exporting..." : "Export"}
          </GlassButton>
        </div>
      ),
    },
  ];
}
