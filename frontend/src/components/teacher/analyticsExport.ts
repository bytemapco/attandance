import toast from "react-hot-toast";
import type { ClassStatsResponse } from "@/types";

export function exportClassSummaryCsv(stats: ClassStatsResponse | null): void {
  if (!stats || !stats.students || stats.students.length === 0) {
    toast.error("No student data to export.");
    return;
  }

  const headers = [
    "Enrollment Number",
    "Student Name",
    "Email",
    "Attended Sessions",
    "Total Sessions",
    "Attendance Rate %",
    "At-Risk Defaulter",
  ];

  const rows = stats.students.map((s) => [
    s.enrollment_number,
    s.full_name,
    s.email,
    s.attended_sessions,
    s.total_sessions,
    `${s.attendance_percentage.toFixed(1)}%`,
    s.at_risk ? "YES" : "NO",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const sanitizedName = (stats.class_name || "class").replace(/[^a-z0-9]/gi, "_").toLowerCase();
  link.setAttribute("href", url);
  link.setAttribute("download", `attendance_summary_${sanitizedName}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("Class attendance report downloaded!");
}
