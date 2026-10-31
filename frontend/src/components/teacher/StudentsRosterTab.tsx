"use client";

import React, { useState, useMemo } from "react";
import { Search, AlertOctagon, CheckCircle2, History, ArrowUpDown } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import type { StudentAttendanceSummaryItem } from "@/types";

interface StudentsRosterTabProps {
  students: StudentAttendanceSummaryItem[];
  totalSessions: number;
  onSelectStudent: (studentId: string, name: string, enrollment: string) => void;
}

type FilterTier = "all" | "regular" | "condonable" | "critical";

export default function StudentsRosterTab({
  students,
  totalSessions,
  onSelectStudent,
}: StudentsRosterTabProps): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTier, setActiveTier] = useState<FilterTier>("all");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const regularCount = useMemo(() => students.filter((s) => s.attendance_percentage >= 75.0).length, [students]);
  const condonableCount = useMemo(() => students.filter((s) => s.attendance_percentage >= 65.0 && s.attendance_percentage < 75.0).length, [students]);
  const criticalCount = useMemo(() => students.filter((s) => s.attendance_percentage < 65.0).length, [students]);

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        if (activeTier === "regular" && s.attendance_percentage < 75.0) return false;
        if (activeTier === "condonable" && (s.attendance_percentage < 65.0 || s.attendance_percentage >= 75.0)) return false;
        if (activeTier === "critical" && s.attendance_percentage >= 65.0) return false;

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchName = s.full_name.toLowerCase().includes(term);
          const matchRoll = s.enrollment_number.toLowerCase().includes(term);
          const matchEmail = s.email.toLowerCase().includes(term);
          if (!matchName && !matchRoll && !matchEmail) return false;
        }

        return true;
      })
      .sort((a, b) => (sortAsc ? a.attendance_percentage - b.attendance_percentage : b.attendance_percentage - a.attendance_percentage));
  }, [students, activeTier, searchTerm, sortAsc]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card p-3.5 rounded-xl border border-[#e3e1dc]">
        <div className="relative w-full md:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718087]" />
          <input
            type="text"
            placeholder="Search student or roll #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#eeece7]/40 border border-[#e3e1dc] focus:outline-none focus:ring-1 focus:ring-[#c98260] text-[#202b30] placeholder-[#718087]"
          />
        </div>

        <div className="inline-flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 rounded-lg bg-[#eeece7]/60 border border-[#e3e1dc]">
          <button
            onClick={() => setActiveTier("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
              activeTier === "all" ? "bg-card text-[#202b30] shadow-xs border border-[#e3e1dc]" : "text-[#526f78] hover:text-[#202b30]"
            }`}
          >
            All <span className="text-[10px] font-mono opacity-80">({students.length})</span>
          </button>
          <button
            onClick={() => setActiveTier("regular")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
              activeTier === "regular" ? "bg-[#e8f3ed] text-[#247653] shadow-xs border border-[#247653]/30" : "text-[#247653] hover:bg-[#e8f3ed]/50"
            }`}
          >
            <CheckCircle2 size={12} /> Regular (&ge;75%) <span className="text-[10px] font-mono opacity-80">({regularCount})</span>
          </button>
          <button
            onClick={() => setActiveTier("condonable")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
              activeTier === "condonable" ? "bg-[#fef7ea] text-[#8a5b12] shadow-xs border border-[#8a5b12]/30" : "text-[#8a5b12] hover:bg-[#fef7ea]/50"
            }`}
          >
            <AlertOctagon size={12} /> Shortage (65-75%) <span className="text-[10px] font-mono opacity-80">({condonableCount})</span>
          </button>
          <button
            onClick={() => setActiveTier("critical")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
              activeTier === "critical" ? "bg-[#f9eaea] text-[#b54242] shadow-xs border border-[#b54242]/30" : "text-[#b54242] hover:bg-[#f9eaea]/50"
            }`}
          >
            <AlertOctagon size={12} /> Critical (&lt;65%) <span className="text-[10px] font-mono opacity-80">({criticalCount})</span>
          </button>
        </div>
      </div>

      {filteredStudents.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[#e3e1dc] bg-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f2ed] border-b border-[#e3e1dc] text-[#526f78] font-semibold">
              <tr>
                <th className="p-3.5">#</th>
                <th className="p-3.5">Enrollment #</th>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Attended / Total</th>
                <th className="p-3.5 cursor-pointer select-none" onClick={() => setSortAsc((prev) => !prev)}>
                  <div className="flex items-center gap-1 hover:text-[#202b30] transition-colors">
                    Percentage <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3e1dc]">
              {filteredStudents.map((std, idx) => {
                const pct = std.attendance_percentage;
                const isRegular = pct >= 75.0;
                const isCondonable = pct >= 65.0 && pct < 75.0;
                const barColor = isRegular ? "bg-[#247653]" : isCondonable ? "bg-[#8a5b12]" : "bg-[#b54242]";
                const textColor = isRegular ? "text-[#247653]" : isCondonable ? "text-[#8a5b12]" : "text-[#b54242]";
                return (
                  <tr key={std.student_id} className="hover:bg-[#eeece7]/40 transition-colors">
                    <td className="p-3.5 font-mono text-[#718087]">{idx + 1}</td>
                    <td className="p-3.5">
                      <span className="font-mono text-xs font-semibold text-[#202b30] bg-[#eeece7] px-2 py-0.5 rounded border border-[#e3e1dc]">
                        {std.enrollment_number}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-[#202b30]">{std.full_name}</div>
                      <div className="text-[11px] text-[#526f78] font-mono">{std.email}</div>
                    </td>
                    <td className="p-3.5 text-[#202b30] font-medium font-mono">
                      {std.attended_sessions} / {totalSessions}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-[#eeece7] rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className={`font-mono font-bold ${textColor}`}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {isRegular && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e8f3ed] text-[#247653] border border-[#247653]/30">
                          Regular
                        </span>
                      )}
                      {isCondonable && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fef7ea] text-[#8a5b12] border border-[#8a5b12]/30">
                          Condonable
                        </span>
                      )}
                      {!isRegular && !isCondonable && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f9eaea] text-[#b54242] border border-[#b54242]/30">
                          Critical
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <GlassButton
                        variant="ghost"
                        size="sm"
                        className="text-xs py-1 px-2.5 h-auto text-[#526f78] hover:text-[#202b30]"
                        icon={<History size={13} />}
                        onClick={() => onSelectStudent(std.student_id, std.full_name, std.enrollment_number)}
                      >
                        History
                      </GlassButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-card border border-[#e3e1dc]">
          <GlassEmptyState
            title="No Matching Students"
            message="No enrolled students match the search criteria or selected filter tier."
          />
        </div>
      )}
    </div>
  );
}
