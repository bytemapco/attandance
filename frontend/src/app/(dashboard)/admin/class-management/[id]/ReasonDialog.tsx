"use client";

import React, { useState } from "react";
import GlassButton from "@/components/ui/GlassButton";
import GlassTextarea from "@/components/ui/GlassTextarea";
import { reasonSchema } from "@/lib/validations/classManagement";

interface ReasonDialogProps {
  title: string;
  confirmLabel: string;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function ReasonDialog({
  title,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: ReasonDialogProps): React.ReactElement {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();

  function submit(): void {
    const parsed = reasonSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    onConfirm(parsed.data.reason);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#28363b]/40 p-4 backdrop-blur-xs" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-2xl border border-[#e3e1dc] bg-card p-6 shadow-[0_8px_24px_rgba(40,54,59,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-base font-bold text-[#202b30]">{title}</h3>
        <GlassTextarea
          label="Reason"
          placeholder="Recorded in the class history"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={error}
        />
        <div className="mt-5 flex justify-end gap-2 border-t border-[#e3e1dc] pt-3">
          <GlassButton variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </GlassButton>
          <GlassButton variant="primary" size="sm" onClick={submit} loading={loading}>
            {confirmLabel}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
