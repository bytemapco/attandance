import api from "@/lib/api";
import type { ReportParams, ReportTab } from "@/types";

export type ExportFormat = "xlsx" | "pdf";

export const MARK_STYLE: Record<string, { code: string; className: string; label: string }> = {
  PRESENT: { code: "P", className: "bg-[#e3f3ea] text-[#247653]", label: "Present" },
  APPROVED: { code: "P", className: "bg-[#e3f3ea] text-[#247653]", label: "Present" },
  LATE: { code: "L", className: "bg-[#fbf0d9] text-[#8a5d0a]", label: "Late" },
  ABSENT: { code: "A", className: "bg-[#f7e3e3] text-[#b54242]", label: "Absent" },
  EXCUSED: { code: "E", className: "bg-[#e2edf3] text-[#3a6a80]", label: "Excused" },
  FLAGGED: { code: "F", className: "bg-[#f9e8dc] text-[#b3541f]", label: "Flagged for review" },
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
