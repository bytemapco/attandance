"use client";

import React, { useState } from "react";
import { Mail } from "lucide-react";
import Button from "./Button";
import ModalFrame from "./ModalFrame";

export interface ResetPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  userEmail?: string;
}

export default function ResetPasswordDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Send password reset link",
  description,
  userEmail,
}: ResetPasswordDialogProps): React.ReactElement | null {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleTrigger = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalFrame label={title} onClose={onClose} className="p-6">
      <h2 className="border-b border-border pb-3 text-base font-semibold text-foreground">{title}</h2>

      <p className="my-4 text-sm text-muted-foreground">
        {description || (
          <>
            Send a password reset link to{" "}
            <strong className="font-semibold text-foreground">{userEmail}</strong>?
          </>
        )}
      </p>

      <form onSubmit={handleTrigger} className="mt-5 flex justify-end gap-2 border-t border-border pt-3">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" loading={loading} icon={<Mail size={15} />}>
          Send reset email
        </Button>
      </form>
    </ModalFrame>
  );
}
