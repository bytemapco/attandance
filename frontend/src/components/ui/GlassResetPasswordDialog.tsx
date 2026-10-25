"use client";

import React, { useState } from "react";
import { Mail, KeyRound, ShieldAlert } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl relative">
        <div className="flex items-center gap-3 mb-3 text-amber-600">
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
            <KeyRound size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">Admin-Initiated Security Action</p>
          </div>
        </div>

        <div className="space-y-3 my-4">
          <p className="text-sm text-foreground leading-relaxed">
            {description || (
              <>
                A secure, time-limited password reset link will be dispatched to{" "}
                <strong className="text-foreground font-semibold">{userEmail}</strong>.
              </>
            )}
          </p>

          <div className="p-3 rounded-lg bg-secondary/70 border border-border flex items-start gap-2.5 text-xs text-muted-foreground">
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              In accordance with security standards, administrators cannot manually set passwords. The user must define their own password via the email link.
            </span>
          </div>
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
