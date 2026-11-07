"use client";

import React from "react";
import { Trash2, Mail, Layers, CheckCircle, AlertTriangle, Check, Info } from "lucide-react";
import { BulkRow, BulkImportEntityType } from "./bulkTypes";
import { BULK_ENTITIES } from "./bulkColumns";
import { buildBatches } from "./bulkPayloadBuilder";

const SHOWN_COLUMNS = 4;

interface BulkImportPreviewTableProps {
  records: BulkRow[];
  entityType: BulkImportEntityType;
  ignoredColumns: string[];
  sendInvite: boolean;
  onSendInviteChange: (send: boolean) => void;
  onRemoveRecord: (id: string) => void;
}

export default function BulkImportPreviewTable({
  records,
  entityType,
  ignoredColumns,
  sendInvite,
  onSendInviteChange,
  onRemoveRecord,
}: BulkImportPreviewTableProps): React.ReactElement {
  const entity = BULK_ENTITIES[entityType];
  const shownColumns = entity.columns.slice(0, SHOWN_COLUMNS);
  const validCount = records.filter((r) => !r.error).length;
  const invalidCount = records.length - validCount;
  const batchCount = buildBatches(records.filter((r) => !r.error)).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-secondary/30 rounded-lg border border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
            {records.length}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Records Found</p>
            <p className="text-xs font-semibold text-foreground">
              {validCount} ready {invalidCount > 0 && `• ${invalidCount} to fix (skipped)`}
            </p>
          </div>
        </div>

        <div className="p-3 bg-secondary/30 rounded-lg border border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center text-info">
            <Layers size={16} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Batch Processing</p>
            <p className="text-xs font-semibold text-foreground">
              {batchCount} {batchCount === 1 ? "batch" : "batches"} (10 per batch)
            </p>
          </div>
        </div>

        {entity.invites ? (
          <div className="p-3 bg-secondary/30 rounded-lg border border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sendInvite ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                <Mail size={16} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Send Welcome Emails</p>
                <p className="text-xs font-semibold text-foreground">{sendInvite ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => onSendInviteChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-card after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        ) : (
          <div className="p-3 bg-secondary/30 rounded-lg border border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
              <Check size={16} aria-hidden />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Import Status</p>
              <p className="text-xs font-semibold text-foreground">Ready to Import</p>
            </div>
          </div>
        )}
      </div>

      {ignoredColumns.length > 0 && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
          Ignored columns this import does not use: {ignoredColumns.join(", ")}
        </p>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="max-h-[260px] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-secondary/60 sticky top-0 z-10 border-b border-border">
              <tr className="text-muted-foreground font-semibold">
                <th className="py-2 px-3 w-10 text-center">#</th>
                {shownColumns.map((column) => (
                  <th key={column.key} className="py-2 px-3">{column.label}</th>
                ))}
                <th className="py-2 px-3 w-40">Status</th>
                <th className="py-2 px-3 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {records.map((r) => (
                <tr
                  key={r.id}
                  className={`hover:bg-secondary/20 transition-colors ${r.error ? "bg-destructive/5 text-destructive" : ""}`}
                >
                  <td className="py-2 px-3 text-center text-muted-foreground font-mono text-xs">{r.number}</td>
                  {shownColumns.map((column) => (
                    <td key={column.key} className="py-2 px-3 text-foreground truncate max-w-[160px]">
                      {r.values[column.key] || "—"}
                    </td>
                  ))}
                  <td className="py-2 px-3">
                    {r.error ? (
                      <span className="inline-flex items-start gap-1 text-xs text-destructive font-medium">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {r.error}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                        <CheckCircle size={12} /> Ready
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveRecord(r.id)}
                      className="p-1 rounded-sm text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      title="Remove row"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
