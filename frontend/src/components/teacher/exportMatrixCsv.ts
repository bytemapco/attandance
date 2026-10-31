import toast from "react-hot-toast";
import type { AttendanceMatrixResponse } from "@/types";

export function exportAttendanceMatrixCsv(matrixData: AttendanceMatrixResponse | null): void {
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
}
