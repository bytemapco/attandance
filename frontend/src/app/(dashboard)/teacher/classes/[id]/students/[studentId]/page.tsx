"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import StudentAttendanceHeader from "@/components/teacher/StudentAttendanceHeader";
import StudentSessionLogsTable from "@/components/teacher/StudentSessionLogsTable";
import type { StudentClassHistoryResponse } from "@/types";

export default function StudentAttendancePage(): React.ReactElement {
  const params = useParams();
  const classId = params?.id as string;
  const studentId = params?.studentId as string;

  const [history, setHistory] = useState<StudentClassHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId || !studentId) return;

    async function loadStudentHistory(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<StudentClassHistoryResponse>(
          `/teacher/classes/${classId}/students/${studentId}/history`
        );
        setHistory(data);
      } catch (err: unknown) {
        const msg = getApiErrorMessage(err, "Failed to load student attendance record");
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }

    void loadStudentHistory();
  }, [classId, studentId]);

  const handleExportCsv = (): void => {
    if (!history || history.sessions.length === 0) return;
    const headers = ["Session", "Date", "Status", "AI Match Score", "Remarks"];
    const rows = history.sessions.map((s) => [
      `"${s.session_name.replace(/"/g, '""')}"`,
      `"${s.session_date}"`,
      `"${s.status}"`,
      `"${(s.final_ai_score * 100).toFixed(0)}%"`,
      `"${(s.remarks || s.student_note || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${history.student_name.replace(/\s+/g, "_")}_attendance.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Student attendance record exported");
  };

  if (loading) {
    return (
      <div className="py-24">
        <GlassLoader text="Loading student attendance history..." />
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="space-y-6">
        <GlassBreadcrumb
          items={[
            { label: "Teacher", href: "/teacher/classes" },
            { label: "Analytics", href: `/teacher/analytics?classId=${classId}` },
            { label: "Student Attendance" },
          ]}
        />
        <div className="p-8 rounded-2xl bg-[#f5f2ed] border border-[#e3e1dc]">
          <GlassEmptyState
            title="Attendance Record Unavailable"
            message={error || "Could not retrieve attendance records for this student."}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <GlassBreadcrumb
        items={[
          { label: "Teacher", href: "/teacher/classes" },
          { label: "Analytics", href: `/teacher/analytics?classId=${classId}` },
          { label: history.student_name },
        ]}
      />

      <StudentAttendanceHeader history={history} onExportCsv={handleExportCsv} />

      <StudentSessionLogsTable sessions={history.sessions} />
    </div>
  );
}
