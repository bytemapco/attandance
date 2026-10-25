"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Download, Search } from "lucide-react";



import api, { getApiErrorMessage } from "@/lib/api";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import GlassButton from "@/components/ui/GlassButton";
import toast from "react-hot-toast";
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

  const handleExportCSV = (): void => {
    if (!matrixData || matrixData.students.length === 0) {
      toast.error("No matrix data available to export.");
      return;
    }

    const sessionHeaders = matrixData.sessions.map((s) => `${s.session_name} (${s.session_date})`);
    const headers = ["Enrollment Number", "Student Name", "Overall Attendance %", ...sessionHeaders];

    const rows = matrixData.students.map((student) => {
      const sessionValues = matrixData.sessions.map((s) => student.statuses[s.session_id] || "Absent");
      return [
        student.enrollment_number,
        student.full_name,
        `${student.attendance_percentage.toFixed(1)}%`,
        ...sessionValues,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitizedName = matrixData.class_name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_matrix_${sanitizedName}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendance matrix exported successfully!");
  };

  if (loading) return <div className="py-12"><GlassLoader text="Generating full attendance matrix grid..." /></div>;
  if (!matrixData || matrixData.sessions.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-card border border-border">
        <GlassEmptyState
          title="No Sessions Conducted"
          message="There are no session records to build an attendance matrix for this class."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card/60 p-3.5 rounded-xl border border-border">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search student or roll no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-emerald-500 text-foreground"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-muted-foreground">
            Showing <strong className="text-foreground">{filteredStudents.length}</strong> students across{" "}
            <strong className="text-foreground">{matrixData.sessions.length}</strong> sessions
          </span>
          <GlassButton
            variant="secondary"
            className="text-xs py-1.5 px-3"
            icon={<Download size={13} />}
            onClick={handleExportCSV}
          >
            Export Matrix CSV
          </GlassButton>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm max-h-[600px] overflow-y-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-20 bg-secondary/90 backdrop-blur-md border-b border-border text-muted-foreground font-semibold">
            <tr>
              <th className="sticky left-0 z-30 bg-secondary/95 backdrop-blur-md p-3 min-w-[180px] border-r border-border">
                Student
              </th>
              <th className="p-3 text-center min-w-[70px] border-r border-border">
                Rate
              </th>
              {matrixData.sessions.map((session) => (
                <th key={session.session_id} className="p-2.5 text-center min-w-[58px] border-r border-border/50">
                  <span className="block font-bold text-foreground">{session.session_name}</span>
                  <span className="text-[10px] text-muted-foreground block font-normal">{session.session_date}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filteredStudents.map((student) => {
              const isDefaulter = student.attendance_percentage < 75.0;
              return (
                <tr key={student.student_id} className="hover:bg-secondary/40 transition-colors">
                  <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-md p-3 border-r border-border">
                    <button
                      onClick={() => onSelectStudent && onSelectStudent(student.student_id, student.full_name, student.enrollment_number)}
                      className="text-left group flex flex-col hover:opacity-80 transition-opacity"
                    >
                      <span className="font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
                        {student.full_name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{student.enrollment_number}</span>
                    </button>
                  </td>
                  <td className="p-3 text-center border-r border-border font-bold">
                    <span className={isDefaulter ? "text-rose-400" : "text-emerald-500"}>
                      {student.attendance_percentage.toFixed(0)}%
                    </span>
                  </td>
                  {matrixData.sessions.map((session) => {
                    const status = student.statuses[session.session_id] || "Absent";
                    const isPresent = status === "Present" || status === "Approved";
                    const isFlagged = status === "Flagged";
                    return (
                      <td key={session.session_id} className="p-2 text-center border-r border-border/50">
                        <span
                          title={`${session.session_name}: ${status}`}
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold border ${
                            isPresent
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : isFlagged
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-rose-500/15 text-rose-400 border-rose-500/30"
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
