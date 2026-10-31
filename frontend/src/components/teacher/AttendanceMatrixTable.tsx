"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Download, Search } from "lucide-react";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import GlassButton from "@/components/ui/GlassButton";
import toast from "react-hot-toast";
import { exportAttendanceMatrixCsv } from "@/components/teacher/exportMatrixCsv";
import type { AttendanceMatrixResponse } from "@/types";

interface AttendanceMatrixTableProps {
  classId: string;
  onSelectStudent?: (studentId: string, name: string, enrollment: string) => void;
}

export default function AttendanceMatrixTable({
  classId,
  onSelectStudent,
}: AttendanceMatrixTableProps): React.ReactElement {
  const [matrixData, setMatrixData] = useState<AttendanceMatrixResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!classId) return;

    async function fetchMatrix(): Promise<void> {
      setLoading(true);
      try {
        const { data } = await api.get<AttendanceMatrixResponse>(`/teacher/classes/${classId}/matrix`);
        setMatrixData(data);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load attendance matrix"));
      } finally {
        setLoading(false);
      }
    }

    void fetchMatrix();
  }, [classId]);

  const filteredStudents = useMemo(() => {
    if (!matrixData) return [];
    if (!searchTerm.trim()) return matrixData.students;
    const term = searchTerm.toLowerCase();
    return matrixData.students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(term) ||
        s.enrollment_number.toLowerCase().includes(term)
    );
  }, [matrixData, searchTerm]);

  if (loading) return <div className="py-12"><GlassLoader text="Loading attendance sheet..." /></div>;
  if (!matrixData || matrixData.sessions.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-card border border-[#e3e1dc]">
        <GlassEmptyState
          title="No Sessions Yet"
          message="No attendance sessions have been conducted for this class yet."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3.5 rounded-xl border border-[#e3e1dc]">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718087]" />
          <input
            type="text"
            placeholder="Search student or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#eeece7]/40 border border-[#e3e1dc] focus:outline-none focus:ring-1 focus:ring-[#c98260] text-[#202b30] placeholder-[#718087]"
          />
        </div>

        <GlassButton
          variant="secondary"
          className="text-xs py-1.5 px-3 self-end sm:self-auto"
          icon={<Download size={13} />}
          onClick={() => exportAttendanceMatrixCsv(matrixData)}
        >
          Export CSV
        </GlassButton>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-card border border-[#e3e1dc] text-xs text-[#526f78]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-[#202b30]">
            <span className="w-5 h-5 rounded text-[11px] font-bold bg-[#e8f3ed] text-[#247653] border border-[#247653]/30 flex items-center justify-center">P</span> Present
          </span>
          <span className="flex items-center gap-1.5 font-medium text-[#202b30]">
            <span className="w-5 h-5 rounded text-[11px] font-bold bg-[#fbf1df] text-[#8a5b12] border border-[#8a5b12]/30 flex items-center justify-center">F</span> Review
          </span>
          <span className="flex items-center gap-1.5 font-medium text-[#202b30]">
            <span className="w-5 h-5 rounded text-[11px] font-bold bg-[#f9eaea] text-[#b54242] border border-[#b54242]/30 flex items-center justify-center">A</span> Absent
          </span>
        </div>
        <span>
          Showing <strong className="text-[#202b30] font-mono">{filteredStudents.length}</strong> students across{" "}
          <strong className="text-[#202b30] font-mono">{matrixData.sessions.length}</strong> sessions
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#e3e1dc] bg-card max-h-[600px] overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-20 bg-[#f5f2ed] border-b border-[#e3e1dc] text-[#526f78] font-semibold">
            <tr>
              <th className="sticky left-0 z-30 bg-[#f5f2ed] p-3 min-w-[180px] border-r border-[#e3e1dc]">
                Student
              </th>
              <th className="p-3 text-center min-w-[80px] border-r border-[#e3e1dc]">
                Attendance
              </th>
              {matrixData.sessions.map((session) => (
                <th key={session.session_id} className="p-2.5 text-center min-w-[58px] border-r border-[#e3e1dc]/80">
                  <span className="block font-semibold text-[#202b30]">{session.session_name}</span>
                  <span className="text-[10px] text-[#718087] block font-normal">{session.session_date}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e1dc]">
            {filteredStudents.map((student) => {
              const pct = student.attendance_percentage;
              const pctColor = pct >= 75.0 ? "text-[#247653]" : pct >= 65.0 ? "text-[#8a5b12]" : "text-[#b54242]";
              return (
                <tr key={student.student_id} className="hover:bg-[#eeece7]/40 transition-colors">
                  <td className="sticky left-0 z-10 bg-card p-3 border-r border-[#e3e1dc]">
                    <button
                      onClick={() => onSelectStudent && onSelectStudent(student.student_id, student.full_name, student.enrollment_number)}
                      className="text-left group flex flex-col hover:opacity-80 transition-opacity"
                    >
                      <span className="font-semibold text-[#202b30] group-hover:text-[#c98260] transition-colors">
                        {student.full_name}
                      </span>
                      <span className="text-[11px] text-[#718087] font-mono">{student.enrollment_number}</span>
                    </button>
                  </td>
                  <td className="p-3 text-center border-r border-[#e3e1dc] font-bold">
                    <span className={pctColor}>
                      {pct.toFixed(0)}%
                    </span>
                  </td>
                  {matrixData.sessions.map((session) => {
                    const status = student.statuses[session.session_id] || "Absent";
                    const isPresent = status === "Present" || status === "Approved";
                    const isFlagged = status === "Flagged";
                    return (
                      <td key={session.session_id} className="p-2 text-center border-r border-[#e3e1dc]/80">
                        <span
                          title={`${session.session_name}: ${status}`}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold border ${
                            isPresent
                              ? "bg-[#e8f3ed] text-[#247653] border-[#247653]/30"
                              : isFlagged
                              ? "bg-[#fbf1df] text-[#8a5b12] border-[#8a5b12]/30"
                              : "bg-[#f9eaea] text-[#b54242] border-[#b54242]/30"
                          }`}
                        >
                          {isPresent ? "P" : isFlagged ? "F" : "A"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
