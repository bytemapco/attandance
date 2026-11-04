import api from "@/lib/api";
import type { ReportParams, ReportTab } from "@/types";

export type ExportFormat = "xlsx" | "pdf";

export const MARK_STYLE: Record<string, { code: string; className: string; label: string }> = {
  PRESENT: { code: "P", className: "bg-success-soft text-success", label: "Present" },
  APPROVED: { code: "P", className: "bg-success-soft text-success", label: "Present" },
  LATE: { code: "L", className: "bg-warning-soft text-warning", label: "Late" },
  ABSENT: { code: "A", className: "bg-destructive-soft text-destructive", label: "Absent" },
  EXCUSED: { code: "E", className: "bg-info-soft text-info", label: "Excused" },
  FLAGGED: { code: "F", className: "bg-accent-soft text-accent-strong", label: "Flagged for review" },
  NOT_ENROLLED: { code: "–", className: "text-muted-foreground", label: "Not yet enrolled" },
};

export function formatPercent(value?: number | null): string {
  return value === null || value === undefined ? "—" : `${Math.round(value * 10) / 10}%`;
}

export function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/** Saves a report as a file. The server builds it from the same query as the screen, so both always agree. */
export async function downloadReport(tab: ReportTab, format: ExportFormat, params: ReportParams): Promise<void> {
  const { data } = await api.get<Blob>(`/reports/${tab}/export`, { params: { ...params, format }, responseType: "blob" });
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${tab}-report.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}
