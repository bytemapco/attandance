"use client";

import React from "react";
import { Trash2, Mail, Layers, CheckCircle, AlertTriangle } from "lucide-react";
import { ParsedBulkRecord, BulkImportEntityType } from "./bulk-types";

interface BulkImportPreviewTableProps {
  records: ParsedBulkRecord[];
  entityType: BulkImportEntityType;
  sendInvite: boolean;
  onSendInviteChange: (send: boolean) => void;
  onRemoveRecord: (id: string) => void;
}

export default function BulkImportPreviewTable({
  records,
  entityType,
  sendInvite,
  onSendInviteChange,
  onRemoveRecord,
}: BulkImportPreviewTableProps): React.ReactElement {
  const validCount = records.filter((r) => r.isValid).length;
  const invalidCount = records.length - validCount;
  const batchCount = Math.ceil(records.length / 10);
  const showInviteToggle = entityType === "students" || entityType === "teachers";

  return (
    <div className="space-y-4">
      {/* Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-secondary/30 rounded-xl border border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            {records.length}
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Records Found</p>
            <p className="text-xs font-semibold text-foreground">
              {validCount} ready {invalidCount > 0 && `• ${invalidCount} to review`}
            </p>
          </div>
        </div>

        <div className="p-3 bg-secondary/30 rounded-xl border border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Layers size={16} />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">Batch Processing</p>
            <p className="text-xs font-semibold text-foreground">
              {batchCount} {batchCount === 1 ? "batch" : "batches"} (10 per batch)
            </p>
          </div>
        </div>

        {showInviteToggle ? (
          <div className="p-3 bg-secondary/30 rounded-xl border border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sendInvite ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                <Mail size={16} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium">Send Welcome Emails</p>
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
              <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        ) : (
          <div className="p-3 bg-secondary/30 rounded-xl border border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs">
              ✓
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Import Status</p>
              <p className="text-xs font-semibold text-foreground">Ready to Import</p>
            </div>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="max-h-[260px] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-secondary/60 sticky top-0 z-10 border-b border-border backdrop-blur-xs">
              <tr className="text-muted-foreground font-semibold">
                <th className="py-2 px-3 w-10 text-center">#</th>
                <th className="py-2 px-3">{entityType === "classes" ? "Class Name" : "Name"}</th>
                <th className="py-2 px-3">
                  {entityType === "students"
                    ? "Enrollment No."
                    : entityType === "teachers"
                    ? "Employee ID"
                    : entityType === "classes"
                    ? "Subject Code"
                    : entityType === "classrooms"
                    ? "Building"
                    : "Code"}
                </th>
                <th className="py-2 px-3">
                  {entityType === "classes"
                    ? "Teacher Email"
                    : entityType === "departments" || entityType === "subjects" || entityType === "designations"
                    ? "Description"
                    : entityType === "classrooms"
                    ? "Building / Block"
                    : "Email"}
                </th>
                <th className="py-2 px-3 w-28 text-center">Status</th>
                <th className="py-2 px-3 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {records.map((r, idx) => (
                <tr
                  key={r.id}
                  className={`hover:bg-secondary/20 transition-colors ${
                    !r.isValid ? "bg-rose-500/5 text-rose-600 dark:text-rose-400" : ""
                  }`}
                >
                  <td className="py-2 px-3 text-center text-muted-foreground font-mono text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 font-medium text-foreground">
                    {entityType === "departments" || entityType === "subjects" || entityType === "classrooms" || entityType === "designations" || entityType === "classes"
                      ? r.first_name
                      : `${r.first_name} ${r.last_name}`}
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">
                    {r.identifier || "—"}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground truncate max-w-[160px]">
                    {entityType === "classrooms" ? r.identifier || "—" : r.email || "—"}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {r.isValid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle size={12} /> Ready
                      </span>
                    ) : (
                      <span
                        title={r.validationError}
                        className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium cursor-help"
                      >
                        <AlertTriangle size={12} /> Review
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveRecord(r.id)}
                      className="p-1 rounded text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
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
