"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import ModalFrame from "@/components/ui/ModalFrame";
import type { Tenant } from "@/types/tenant";

interface DeleteTenantModalProps {
  isOpen: boolean;
  tenant: Tenant | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export default function DeleteTenantModal({
  isOpen,
  tenant,
  onClose,
  onConfirm,
}: DeleteTenantModalProps): React.ReactElement | null {
  const [confirmInput, setConfirmInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !tenant) return null;

  const expectedText = tenant.slug;
  const isMatch = confirmInput.trim().toLowerCase() === expectedText.toLowerCase();

  const handleDelete = async (): Promise<void> => {
    if (!isMatch) return;
    try {
      setLoading(true);
      setError(null);
      await onConfirm(tenant.id);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete institution.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalFrame label="Delete institution" onClose={onClose}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-destructive" aria-hidden />
          <div>
            <h2 className="text-base font-semibold text-destructive">Delete institution</h2>
            <p className="text-sm text-muted-foreground">{tenant.name}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          This cannot be undone. All classes, user accounts, and attendance records for{" "}
          <strong className="text-foreground">{tenant.name}</strong> will be permanently removed.
        </p>

        {error && (
          <div className="rounded-lg border border-destructive-border bg-destructive-soft p-3 text-sm font-medium text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2 rounded-lg border border-border bg-surface p-3.5">
          <label htmlFor="confirm-delete-slug" className="block text-sm font-medium text-foreground">
            To confirm, type <span className="select-all font-mono font-semibold text-destructive">{expectedText}</span> below:
          </label>
          <input
            id="confirm-delete-slug"
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-card px-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
            placeholder={expectedText}
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!isMatch}
            loading={loading}
            icon={<Trash2 size={14} />}
            onClick={() => void handleDelete()}
          >
            Delete institution
          </Button>
        </div>
      </div>
    </ModalFrame>
  );
}
