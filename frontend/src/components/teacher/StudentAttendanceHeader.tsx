"use client";

import React from "react";
import { Download } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import type { StudentClassHistoryResponse } from "@/types";

interface StudentAttendanceHeaderProps {
  history: StudentClassHistoryResponse;
  onExportCsv?: () => void;
}

export default function StudentAttendanceHeader({
  history,
  onExportCsv,
}: StudentAttendanceHeaderProps): React.ReactElement {
  const isLow = history.attendance_percentage < 75;
  const initials = history.student_name.slice(0, 2).toUpperCase();

  return (
    <div className="p-4 rounded-xl border border-[#e3e1dc] bg-card shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Student Profile Info */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#eeece7] text-[#28363b] font-bold text-sm flex items-center justify-center border border-[#e3e1dc] shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-base font-bold text-[#202b30]">{history.student_name}</h1>
            <p className="text-xs text-[#526f78] mt-0.5 flex items-center gap-2">
              <span className="font-mono text-[#202b30] font-semibold">{history.enrollment_number}</span>
              <span>•</span>
              <span>{history.class_name}</span>
            </p>
          </div>
        </div>

        {/* Attendance Rate & Export Action */}
        <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 sm:border-l border-[#e3e1dc] pt-3 sm:pt-0 sm:pl-5">
          <div>
            <span className="text-[11px] text-[#526f78] block font-medium">Overall Attendance</span>
            <span className={`text-base font-bold tabular-nums ${isLow ? "text-[#b54242]" : "text-[#247653]"}`}>
              {history.attendance_percentage.toFixed(1)}%
            </span>
          </div>

          {onExportCsv && (
            <GlassButton
              variant="secondary"
              size="sm"
              icon={<Download size={13} />}
              onClick={onExportCsv}
              disabled={history.sessions.length === 0}
            >
              Export CSV
            </GlassButton>
          )}
        </div>
      </div>
    </div>
  );
}
