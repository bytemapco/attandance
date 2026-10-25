import type { StudentRosterItem } from "@/types";

export function exportToCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((fieldName) => {
          const value = row[fieldName];
          const stringValue = value === null || value === undefined ? "" : String(value);
          const escaped = stringValue.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportRosterToCSV(className: string, roster: StudentRosterItem[]): void {
  const formattedRows = roster.map((item) => ({
    "Enrollment Number": item.enrollment_number,
    "Full Name": item.full_name,
    "Email": item.email,
    "Attendance Status": item.status,
    "AI Confidence Score": `${(item.final_score * 100).toFixed(1)}%`,
    "Timestamp": item.marked_at ? new Date(item.marked_at).toLocaleString() : "N/A",
  }));

  const cleanClassName = className.replace(/[^a-zA-Z0-9_-]/g, "_");
  const dateStr = new Date().toISOString().split("T")[0];
  exportToCSV(`Attendance_${cleanClassName}_${dateStr}`, formattedRows);
}
