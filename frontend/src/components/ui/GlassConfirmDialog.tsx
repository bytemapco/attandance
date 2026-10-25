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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 mb-5">
          <div className={cn(
            "p-2.5 rounded-lg shrink-0",
            variant === "danger" ? "bg-red-50 text-red-600 border border-red-100" : "bg-sky-50 text-sky-600 border border-sky-100"
          )}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
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
