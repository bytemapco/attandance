"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import Button from "./Button";
import ModalFrame from "./ModalFrame";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: "danger" | "primary";
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  loading = false,
  variant = "danger",
}: ConfirmDialogProps): React.ReactElement | null {
  if (!isOpen) return null;

  return (
    <ModalFrame label={title} onClose={onCancel} className="p-6">
      <div className="mb-5 flex items-start gap-3">
        <AlertTriangle
          size={20}
          className={cn("mt-0.5 shrink-0", variant === "danger" ? "text-destructive" : "text-info")}
          aria-hidden
        />
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-border pt-3">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={variant === "danger" ? "danger" : "primary"}
          size="sm"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </ModalFrame>
  );
}
