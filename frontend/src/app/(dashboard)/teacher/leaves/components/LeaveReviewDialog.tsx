"use client";

import React from "react";
import { CheckCircle2, XCircle, FileText, Image as ImageIcon, Calendar, User, Eye } from "lucide-react";
import type { PendingLeaveItem } from "@/types";

interface LeaveReviewDialogProps {
  leave: PendingLeaveItem | null;
  action: "APPROVED" | "REJECTED" | null;
  approverNote: string;
  submitting: boolean;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onViewDoc: (leave: PendingLeaveItem) => void;
}

export default function LeaveReviewDialog({
  leave,
  action,
  approverNote,
  submitting,
  onNoteChange,
  onConfirm,
  onCancel,
  onViewDoc,
}: LeaveReviewDialogProps): React.ReactElement | null {
  if (!leave || !action) return null;

  const isApproved = action === "APPROVED";
  const fromDate = new Date(leave.start_date).toLocaleDateString();
  const toDate = new Date(leave.end_date).toLocaleDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-secondary/30 flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${isApproved ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 border-destructive/20 text-destructive"}`}>
            {isApproved ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {isApproved ? "Approve Leave Request" : "Reject Leave Request"}
            </h3>
            <p className="text-xs text-muted-foreground">Review request details and add decision notes</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3 bg-secondary/30 p-3.5 rounded-xl border border-border">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <User size={16} className="text-primary shrink-0" />
              <div className="overflow-hidden">
                <div className="text-[11px] text-muted-foreground font-medium">Student</div>
                <div className="font-semibold text-foreground text-xs truncate">{leave.student_name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Calendar size={16} className="text-primary shrink-0" />
              <div className="overflow-hidden">
                <div className="text-[11px] text-muted-foreground font-medium">Period</div>
                <div className="font-semibold text-foreground text-xs">{fromDate} – {toDate}</div>
              </div>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-foreground block mb-1.5">Reason for Leave</span>
            <div className="p-3 bg-secondary/20 rounded-xl border border-border text-foreground text-xs leading-relaxed">
              {leave.reason}
            </div>
          </div>

          {/* Attached Document Preview */}
          <div>
            <span className="text-xs font-semibold text-foreground block mb-1.5">Attached Documentation</span>
            {leave.document_url ? (
              <div className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  {leave.document_url.toLowerCase().split("?")[0].endsWith(".pdf") ? <FileText size={16} /> : <ImageIcon size={16} />}
                  <span>Document Attached (S3)</span>
                </div>
                <button
                  type="button"
                  onClick={() => onViewDoc(leave)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Eye size={13} /> View Doc
                </button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic p-3 bg-secondary/20 rounded-xl border border-border">
                No supporting document attached
              </div>
            )}
          </div>

          {/* Note Input */}
          <div>
            <label htmlFor="approver-note" className="text-xs font-semibold text-foreground block mb-1.5">
              Approver Note (Optional)
            </label>
            <textarea
              id="approver-note"
              value={approverNote}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder={isApproved ? "Optional approval note..." : "Reason for rejection..."}
              maxLength={300}
              rows={2}
              className="w-full px-3 py-2 bg-card border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-secondary/20 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-muted text-foreground text-xs font-medium transition-colors border border-border cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90 disabled:opacity-50 ${isApproved ? "bg-emerald-600 hover:bg-emerald-500" : "bg-destructive hover:bg-destructive/90"}`}
          >
            {isApproved ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {submitting ? "Processing..." : (isApproved ? "Confirm Approval" : "Confirm Rejection")}
          </button>
        </div>
      </div>
    </div>
  );
}
