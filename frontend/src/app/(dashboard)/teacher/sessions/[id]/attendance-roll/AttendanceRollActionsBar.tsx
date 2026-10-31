"use client";

import React from "react";
import { RefreshCw, QrCode, Download, CheckCheck } from "lucide-react";

interface AttendanceRollActionsBarProps {
  markingAll: boolean;
  onOpenQr: () => void;
  onExportCsv: () => void;
  onMarkAllPresent: () => void;
  onRefresh: () => void;
}

export default function AttendanceRollActionsBar({
  markingAll,
  onOpenQr,
  onExportCsv,
  onMarkAllPresent,
  onRefresh,
}: AttendanceRollActionsBarProps): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onOpenQr}
        type="button"
        className="flex items-center gap-1.5 rounded-lg bg-[#28363b] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-[#202b30] focus:outline-none focus:ring-2 focus:ring-[#28363b]/30"
      >
        <QrCode className="h-4 w-4 text-[#c98260]" />
        SmartPass QR
      </button>

      <button
        onClick={onMarkAllPresent}
        disabled={markingAll}
        type="button"
        className="flex items-center gap-1.5 rounded-lg border border-[#247653]/30 bg-[#e8f3ed] px-3 py-1.5 text-xs font-semibold text-[#247653] transition-colors hover:bg-[#def0e5] disabled:opacity-50"
      >
        <CheckCheck className="h-4 w-4 text-[#247653]" />
        {markingAll ? "Marking..." : "Mark All Present"}
      </button>

      <button
        onClick={onExportCsv}
        type="button"
        className="flex items-center gap-1.5 rounded-lg border border-[#e3e1dc] bg-card px-3 py-1.5 text-xs font-semibold text-[#28363b] transition-colors hover:bg-[#eeece7] shadow-2xs"
      >
        <Download className="h-3.5 w-3.5 text-[#526f78]" />
        Export CSV
      </button>

      <button
        onClick={onRefresh}
        type="button"
        className="flex items-center gap-1.5 rounded-lg border border-[#e3e1dc] bg-card px-3 py-1.5 text-xs font-semibold text-[#28363b] transition-colors hover:bg-[#eeece7] shadow-2xs"
      >
        <RefreshCw className="h-3.5 w-3.5 text-[#526f78]" />
        Refresh
      </button>
    </div>
  );
}
