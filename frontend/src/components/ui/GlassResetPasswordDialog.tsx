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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl relative">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#e3e1dc]">
          <div className="p-2 rounded-lg bg-[#eeece7] text-[#28363b] border border-[#e3e1dc]">
            <KeyRound size={16} />
          </div>
          <h2 className="text-sm font-semibold text-[#28363b]">{title}</h2>
        </div>

        <div className="my-4">
          <p className="text-xs text-[#526f78] leading-relaxed">
            {description || (
              <>
                Send a secure password reset link to{" "}
                <strong className="text-[#202b30] font-semibold">{userEmail}</strong>?
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
