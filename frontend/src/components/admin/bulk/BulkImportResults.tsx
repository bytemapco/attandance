"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Download, Mail, RefreshCw } from "lucide-react";
import { BulkImportSummary, BulkImportEntityType } from "./bulkTypes";

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

  const handleDownloadFailedCsv = (): void => {
    if (summary.failedRecords.length === 0) return;
    let header = "";
    if (entityType === "students") {
      header = "email,enrollment_number,first_name,last_name,error_reason\n";
    } else if (entityType === "teachers") {
      header = "email,employee_id,first_name,last_name,error_reason\n";
    } else if (entityType === "classes") {
      header = "class_name,subject_code,teacher_email,classroom_name,error_reason\n";
    } else if (entityType === "departments") {
      header = "name,code,head,description,error_reason\n";
    } else if (entityType === "subjects" || entityType === "designations") {
      header = "name,code,description,error_reason\n";
    } else if (entityType === "classrooms") {
      header = "name,building,error_reason\n";
    }

    const rows = summary.failedRecords
      .map((r) => {
        const err = `"${r.validationError || "Import error"}"`;
        if (entityType === "classes") {
          return `${r.first_name},${r.identifier},${r.email},${r.last_name},${err}`;
        }
        if (entityType === "departments") {
          return `${r.first_name},${r.identifier},${r.last_name},${r.email},${err}`;
        }
        if (entityType === "subjects" || entityType === "designations") {
          return `${r.first_name},${r.identifier},${r.email},${err}`;
        }
        if (entityType === "classrooms") {
          return `${r.first_name},${r.identifier},${err}`;
        }
        return `${r.email},${r.identifier},${r.first_name},${r.last_name},${err}`;
      })
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
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
        className={`p-4 rounded-xl border flex items-center gap-3.5 ${
          isAllSuccess
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : isPartial
            ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
            : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
        }`}
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-background/50">
          {isAllSuccess && <CheckCircle2 size={24} className="text-emerald-500" />}
          {isPartial && <AlertTriangle size={24} className="text-amber-500" />}
          {!isAllSuccess && !isPartial && <XCircle size={24} className="text-rose-500" />}
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">
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
        <div className="p-3 bg-secondary/30 rounded-xl border border-border">
          <p className="text-[11px] text-muted-foreground font-medium">Successfully Added</p>
          <p className="text-xl font-bold font-mono text-foreground mt-0.5">{summary.totalImported}</p>
        </div>

        <div className="p-3 bg-secondary/30 rounded-xl border border-border">
          <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
            <Mail size={12} className="text-indigo-500" /> Invitations Sent
          </p>
          <p className="text-xl font-bold font-mono text-foreground mt-0.5">{summary.totalInvited}</p>
        </div>

        <div className="p-3 bg-secondary/30 rounded-xl border border-border">
          <p className="text-[11px] text-muted-foreground font-medium">Failed</p>
          <p className="text-xl font-bold font-mono text-foreground mt-0.5">{summary.totalFailed}</p>
        </div>
      </div>

      {/* Error / Discrepancy Breakdown */}
      {summary.allErrors.length > 0 && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle size={13} /> {summary.allErrors.length} {summary.allErrors.length === 1 ? "Issue" : "Issues"} to Review
            </span>
            {summary.failedRecords.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadFailedCsv}
                className="text-[11px] text-rose-600 hover:text-rose-700 underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <Download size={11} /> Download Error Report
              </button>
            )}
          </div>
          <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] font-sans text-rose-700 dark:text-rose-300 pr-1">
            {summary.allErrors.map((err, idx) => (
              <p key={idx} className="bg-background/60 px-2.5 py-1.5 rounded border border-rose-500/10 font-medium">
                {err}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
        >
          <RefreshCw size={13} /> Import Another File
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
