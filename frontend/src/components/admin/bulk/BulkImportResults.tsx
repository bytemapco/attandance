"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Download, Mail, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import { BulkImportSummary, BulkImportEntityType } from "./bulkTypes";
import { BULK_ENTITIES } from "./bulkColumns";
import { toCsv } from "./csv";

interface BulkImportResultsProps {
  summary: BulkImportSummary;
  entityType: BulkImportEntityType;
  onClose: () => void;
  onReset: () => void;
}

export default function BulkImportResults({
  summary,
  entityType,
  onClose,
  onReset,
}: BulkImportResultsProps): React.ReactElement {
  const isAllSuccess = summary.totalFailed === 0 && summary.totalImported > 0;
  const isPartial = summary.totalFailed > 0 && summary.totalImported > 0;

  // Every column is kept, so the report can be fixed and uploaded again; the extra reason column is ignored on import.
  const handleDownloadFailedCsv = (): void => {
    if (summary.failedRecords.length === 0) return;
    const keys = BULK_ENTITIES[entityType].columns.map((column) => column.key);
    const rows = summary.failedRecords.map(({ row, reason }) => [...keys.map((key) => row.values[key] ?? ""), reason]);
    const blob = new Blob([toCsv([[...keys, "error_reason"], ...rows])], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `failed-${entityType}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div
        className={`p-4 rounded-lg border flex items-center gap-3.5 ${
          isAllSuccess
            ? "bg-success/10 border-success/20 text-success"
            : isPartial
            ? "bg-warning/10 border-warning/20 text-warning"
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-background/50">
          {isAllSuccess && <CheckCircle2 size={24} className="text-success" />}
          {isPartial && <AlertTriangle size={24} className="text-warning" />}
          {!isAllSuccess && !isPartial && <XCircle size={24} className="text-destructive" />}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {isAllSuccess
              ? "Import Completed Successfully"
              : isPartial
              ? "Import Completed with Warnings"
              : "Import Encountered Issues"}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {summary.totalImported === summary.totalProcessed && summary.totalProcessed > 0
              ? `All ${summary.totalProcessed} records were imported successfully.`
              : `${summary.totalImported} of ${summary.totalProcessed} records were imported successfully.`}
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-secondary/30 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground font-medium">Successfully Added</p>
          <p className="text-xl font-semibold font-mono text-foreground mt-0.5">{summary.totalImported}</p>
        </div>

        <div className="p-3 bg-secondary/30 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Mail size={12} className="text-info" /> Invitations Sent
          </p>
          <p className="text-xl font-semibold font-mono text-foreground mt-0.5">{summary.totalInvited}</p>
        </div>

        <div className="p-3 bg-secondary/30 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground font-medium">Failed</p>
          <p className="text-xl font-semibold font-mono text-foreground mt-0.5">{summary.totalFailed}</p>
        </div>
      </div>

      {/* Error / Discrepancy Breakdown */}
      {summary.allErrors.length > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-destructive flex items-center gap-1.5">
              <AlertTriangle size={13} /> {summary.allErrors.length} {summary.allErrors.length === 1 ? "Issue" : "Issues"} to Review
            </span>
            {summary.failedRecords.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadFailedCsv}
                className="text-xs text-destructive hover:text-destructive underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <Download size={11} /> Download Error Report
              </button>
            )}
          </div>
          <div className="max-h-28 overflow-y-auto space-y-1 text-xs font-sans text-destructive pr-1">
            {summary.allErrors.map((err, idx) => (
              <p key={idx} className="bg-background/60 px-2.5 py-1.5 rounded-sm border border-destructive/10 font-medium">
                {err}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button variant="ghost" icon={<RefreshCw size={14} />} onClick={onReset}>
          Import another file
        </Button>

        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}
