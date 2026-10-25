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

type FilterTier = "all" | "at_risk" | "critical" | "regular";

export default function StudentsRosterTab({
  students,
  totalSessions,
  onSelectStudent,
}: StudentsRosterTabProps): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTier, setActiveTier] = useState<FilterTier>("all");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const atRiskCount = useMemo(() => students.filter((s) => s.attendance_percentage < 75.0).length, [students]);
  const criticalCount = useMemo(() => students.filter((s) => s.attendance_percentage < 50.0).length, [students]);
  const regularCount = useMemo(() => students.filter((s) => s.attendance_percentage >= 75.0).length, [students]);

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        if (activeTier === "at_risk" && s.attendance_percentage >= 75.0) return false;
        if (activeTier === "critical" && s.attendance_percentage >= 50.0) return false;
        if (activeTier === "regular" && s.attendance_percentage < 75.0) return false;

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchName = s.full_name.toLowerCase().includes(term);
          const matchRoll = s.enrollment_number.toLowerCase().includes(term);
          const matchEmail = s.email.toLowerCase().includes(term);
          if (!matchName && !matchRoll && !matchEmail) return false;
        }

        return true;
      })
      .sort((a, b) => {
        return sortAsc
          ? a.attendance_percentage - b.attendance_percentage
          : b.attendance_percentage - a.attendance_percentage;
      });
  }, [students, activeTier, searchTerm, sortAsc]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card/60 p-3.5 rounded-xl border border-border">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, roll no, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-emerald-500 text-foreground"
          />
        </div>

        {/* Tier Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveTier("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTier === "all" ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            All <span className="opacity-70 text-[11px]">({students.length})</span>
          </button>
          <button
            onClick={() => setActiveTier("at_risk")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTier === "at_risk" ? "bg-rose-500 text-white" : "bg-secondary text-rose-400 hover:text-rose-300"
            }`}
          >
            <AlertOctagon size={12} /> Defaulters &lt;75% <span className="opacity-80 text-[11px]">({atRiskCount})</span>
          </button>
          <button
            onClick={() => setActiveTier("critical")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTier === "critical" ? "bg-rose-700 text-white" : "bg-secondary text-rose-500 hover:text-rose-400"
            }`}
          >
            Critical &lt;50% <span className="opacity-80 text-[11px]">({criticalCount})</span>
          </button>
          <button
            onClick={() => setActiveTier("regular")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTier === "regular" ? "bg-emerald-600 text-white" : "bg-secondary text-emerald-400 hover:text-emerald-300"
            }`}
          >
            <CheckCircle2 size={12} /> Good Standing <span className="opacity-80 text-[11px]">({regularCount})</span>
          </button>
        </div>
      </div>

      {/* Roster Table */}
      {filteredStudents.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/70 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Student Details</th>
                <th className="p-3.5">Classes Attended</th>
                <th className="p-3.5 cursor-pointer select-none" onClick={() => setSortAsc((prev) => !prev)}>
                  <div className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Attendance Rate <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="p-3.5">Academic Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredStudents.map((std) => {
                const isDefaulter = std.attendance_percentage < 75.0;
                const isCritical = std.attendance_percentage < 50.0;
                return (
                  <tr key={std.student_id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary text-foreground font-bold text-xs flex items-center justify-center border border-border">
                          {std.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{std.full_name}</div>
                          <div className="text-[11px] text-muted-foreground">{std.enrollment_number} • {std.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-foreground font-medium">
                      {std.attended_sessions} / {totalSessions} <span className="text-[11px] text-muted-foreground font-normal">sessions</span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-secondary rounded-full h-2 overflow-hidden border border-border/50">
                          <div
                            className={`h-full rounded-full ${
                              isCritical ? "bg-rose-600" : isDefaulter ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, std.attendance_percentage)}%` }}
                          />
                        </div>
                        <span className={`font-bold ${isDefaulter ? "text-rose-400" : "text-emerald-500"}`}>
                          {std.attendance_percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {isCritical ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600/15 text-rose-400 border border-rose-600/30">
                          Critical Defaulter
                        </span>
                      ) : isDefaulter ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          At Risk (&lt;75%)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Good Standing
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <GlassButton
                        variant="secondary"
                        className="text-xs py-1 px-2.5 h-auto"
                        icon={<History size={13} />}
                        onClick={() => onSelectStudent(std.student_id, std.full_name, std.enrollment_number)}
                      >
                        View History
                      </GlassButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-card border border-border">
          <GlassEmptyState
            title="No Matching Students"
            message="No enrolled students match the search criteria or selected filter tier."
          />
        </div>
      )}
    </div>
  );
}
