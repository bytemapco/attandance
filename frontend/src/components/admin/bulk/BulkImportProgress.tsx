"use client";

import React from "react";
import { Loader2, CheckCircle2, AlertCircle, Clock, Mail, ShieldAlert } from "lucide-react";
import { BatchProgressItem } from "./bulk-types";

interface BulkImportProgressProps {
  batches: BatchProgressItem[];
  currentBatchIndex: number;
  totalRecords: number;
  processedRecords: number;
  importedCount: number;
  failedCount: number;
  invitationsSent: number;
  onAbort: () => void;
  isAborting: boolean;
}

export default function BulkImportProgress({
  batches,
  currentBatchIndex,
  totalRecords,
  processedRecords,
  importedCount,
  failedCount,
  invitationsSent,
  onAbort,
  isAborting,
}: BulkImportProgressProps): React.ReactElement {
  const percentage = totalRecords > 0 ? Math.min(100, Math.round((processedRecords / totalRecords) * 100)) : 0;

  return (
    <div className="space-y-4">
      {/* Progress Bar Header */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-2">
            <Loader2 size={13} className="animate-spin text-primary" />
            Importing Batch {Math.min(currentBatchIndex + 1, batches.length)} of {batches.length}...
          </span>
          <span className="font-mono text-xs font-bold text-primary">{percentage}%</span>
        </div>
        <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{processedRecords} of {totalRecords} records processed</span>
          <span>10 records per batch</span>
        </div>
      </div>

      {/* Real-time KPI Counters */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
            Imported
          </p>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            {importedCount}
          </p>
        </div>

        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400">
            Invitations Sent
          </p>
          <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1.5">
            <Mail size={16} /> {invitationsSent}
          </p>
        </div>

        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-rose-600 dark:text-rose-400">
            Failed
          </p>
          <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
            {failedCount}
          </p>
        </div>
      </div>

      {/* Live Batch Queue List */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="px-3 py-2 bg-secondary/50 border-b border-border text-xs font-semibold text-muted-foreground flex justify-between">
          <span>Import Progress by Batch</span>
          <span>Status</span>
        </div>
        <div className="max-h-[160px] overflow-y-auto divide-y divide-border">
          {batches.map((batch) => {
            const isCurrent = batch.status === "processing";
            const isCompleted = batch.status === "success" || batch.status === "warning";
            const isFailed = batch.status === "failed";

            return (
              <div
                key={batch.batchNumber}
                className={`px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                  isCurrent ? "bg-primary/5 font-medium" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCurrent && <Loader2 size={13} className="animate-spin text-primary" />}
                  {isCompleted && <CheckCircle2 size={13} className="text-emerald-500" />}
                  {isFailed && <AlertCircle size={13} className="text-rose-500" />}
                  {batch.status === "queued" && <Clock size={13} className="text-muted-foreground" />}
                  <span className="text-foreground">
                    Batch #{batch.batchNumber}{" "}
                    <span className="text-muted-foreground text-[11px]">
                      (Rows {batch.startIndex + 1}–{batch.endIndex})
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isCompleted && (
                    <span className="text-[11px] text-muted-foreground">
                      +{batch.importedCount} imported ({batch.invitationsSent} invited)
                    </span>
                  )}
                  {batch.status === "processing" && (
                    <span className="text-[11px] text-primary font-medium">Processing...</span>
                  )}
                  {batch.status === "queued" && (
                    <span className="text-[11px] text-muted-foreground">Waiting</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-muted-foreground">
          Please keep this window open until the import finishes.
        </span>
        <button
          type="button"
          onClick={onAbort}
          disabled={isAborting}
          className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          <ShieldAlert size={13} /> {isAborting ? "Stopping..." : "Stop Import"}
        </button>
      </div>
    </div>
  );
}
