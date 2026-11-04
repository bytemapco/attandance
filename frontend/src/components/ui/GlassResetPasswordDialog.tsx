"use client";

import React, { useState } from "react";
import { Mail, KeyRound } from "lucide-react";
import GlassButton from "./GlassButton";

export interface GlassResetPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  userEmail?: string;
}

export default function GlassResetPasswordDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Send Password Reset Link",
  description,
  userEmail,
}: GlassResetPasswordDialogProps): React.ReactElement | null {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl relative">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="p-2 rounded-lg bg-secondary text-primary border border-border">
            <KeyRound size={16} />
          </div>
          <h2 className="text-sm font-semibold text-primary">{title}</h2>
        </div>

        <div className="my-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description || (
              <>
                Send a secure password reset link to{" "}
                <strong className="text-foreground font-semibold">{userEmail}</strong>?
              </>
            )}
          </p>
        </div>

        <form onSubmit={handleTrigger} className="flex gap-2 justify-end mt-5 pt-3 border-t border-border">
          <GlassButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </GlassButton>
          <GlassButton
            type="submit"
            variant="primary"
            size="sm"
            loading={loading}
            icon={<Mail size={15} />}
          >
            Send Reset Email
          </GlassButton>
        </form>
      </div>
    </div>
  );
}
