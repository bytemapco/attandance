"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

interface LeaveDecisionCardProps {
  submitting: boolean;
  onDecision: (status: "APPROVED" | "REJECTED", note?: string) => Promise<void>;
}

export default function LeaveDecisionCard({
  submitting,
  onDecision,
}: LeaveDecisionCardProps): React.ReactElement {
  const [approverNote, setApproverNote] = useState("");

  const handleSubmit = (status: "APPROVED" | "REJECTED") => {
    void onDecision(status, approverNote.trim() || undefined);
  };

  return (
    <GlassCard className="p-6 bg-card border border-border space-y-5">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border">
        <div className="p-2 rounded-xl bg-success/10 text-success">
          <ShieldCheck size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-primary">Faculty Decision</h3>
          <p className="text-xs text-muted-foreground">Approve or reject this request with contextual feedback.</p>
        </div>
      </div>

      <div>
        <label htmlFor="approver-note" className="text-xs font-semibold text-primary block mb-1.5">
          Faculty Remarks / Justification <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
        </label>
        <textarea
          id="approver-note"
          rows={3}
          value={approverNote}
          onChange={(e) => setApproverNote(e.target.value)}
          placeholder="Add contextual remarks or notes for the student's academic record..."
          maxLength={300}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-primary placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all resize-y"
        />
        <div className="flex justify-end mt-1 text-[11px] text-muted-foreground font-mono">
          {approverNote.length}/300
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit("REJECTED")}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 font-semibold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          <XCircle size={16} />
          <span>Reject Leave</span>
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit("APPROVED")}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-success hover:bg-success text-primary-foreground font-semibold text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 size={16} />
          <span>Approve Leave</span>
        </button>
      </div>
    </GlassCard>
  );
}
