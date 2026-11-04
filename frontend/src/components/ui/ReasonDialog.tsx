"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import ModalFrame from "@/components/ui/ModalFrame";
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
    <ModalFrame label={title} onClose={onCancel} className="p-6">
      <h3 className="mb-4 text-base font-semibold text-foreground">{title}</h3>
      <Textarea
        label="Reason"
        placeholder="Recorded in the class history"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={error}
      />
      <div className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={submit} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </ModalFrame>
  );
}
