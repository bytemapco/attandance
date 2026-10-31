import React from "react";
import { Users, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface AttendanceRollSummaryBarProps {
  total: number;
  present: number;
  absent: number;
  flagged: number;
}

export default function AttendanceRollSummaryBar({
  total,
  present,
  absent,
  flagged,
}: AttendanceRollSummaryBarProps): React.ReactElement {
  const presentPct = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";
  const absentPct = total > 0 ? ((absent / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <div className="p-4 rounded-xl border border-[#e3e1dc] bg-card shadow-[0_2px_8px_rgba(40,54,59,0.05)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#526f78] mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Enrolled</span>
          <Users size={16} className="text-[#526f78]" />
        </div>
        <div className="text-2xl font-bold font-mono text-[#28363b]">{total}</div>
        <span className="text-[11px] text-[#718087] mt-1">Total registered students</span>
      </div>

      <div className="p-4 rounded-xl border border-[#247653]/30 bg-[#e8f3ed]/50 shadow-[0_2px_8px_rgba(40,54,59,0.05)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#247653] mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Present</span>
          <CheckCircle2 size={16} className="text-[#247653]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-[#247653]">{present}</span>
          <span className="text-xs font-mono font-medium text-[#247653]/90">({presentPct}%)</span>
        </div>
        <span className="text-[11px] text-[#526f78] mt-1">Marked attendance</span>
      </div>

      <div className="p-4 rounded-xl border border-[#b54242]/30 bg-[#f9eaea]/50 shadow-[0_2px_8px_rgba(40,54,59,0.05)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#b54242] mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Absent</span>
          <XCircle size={16} className="text-[#b54242]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-[#b54242]">{absent}</span>
          <span className="text-xs font-mono font-medium text-[#b54242]/90">({absentPct}%)</span>
        </div>
        <span className="text-[11px] text-[#526f78] mt-1">Not attended yet</span>
      </div>

      <div className="p-4 rounded-xl border border-[#8a5b12]/30 bg-[#fbf1df]/50 shadow-[0_2px_8px_rgba(40,54,59,0.05)] flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#8a5b12] mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Flagged</span>
          <AlertTriangle size={16} className="text-[#8a5b12]" />
        </div>
        <div className="text-2xl font-bold font-mono text-[#8a5b12]">{flagged}</div>
        <span className="text-[11px] text-[#526f78] mt-1">Needs verification</span>
      </div>
    </div>
  );
}
