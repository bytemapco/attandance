"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import GlassButton from "./GlassButton";
import { cn } from "@/lib/utils";

export interface GlassConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: "danger" | "primary";
}

export default function GlassConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  loading = false,
  variant = "danger",
}: GlassConfirmDialogProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-[0_8px_24px_rgba(40,54,59,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 mb-5">
          <div className={cn(
            "p-2.5 rounded-xl shrink-0 border",
            variant === "danger"
              ? "bg-destructive-soft text-destructive border-destructive-border"
              : "bg-info-soft text-info border-info-border"
          )}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <GlassButton variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </GlassButton>
          <GlassButton
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
