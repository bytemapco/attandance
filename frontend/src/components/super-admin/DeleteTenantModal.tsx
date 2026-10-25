"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";
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
        setError("Failed to delete tenant institution.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-destructive/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-destructive/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-destructive/20 text-destructive flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-destructive">Delete Institution</h2>
              <p className="text-xs text-muted-foreground font-mono">{tenant.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            This action <strong className="text-destructive font-semibold">CANNOT be undone</strong>. This will permanently delete the tenant institution <strong className="text-foreground">{tenant.name}</strong>, clear database records, purge active user sessions, and remove domain routing.
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2 bg-muted/30 p-3.5 rounded-xl border border-border">
            <label className="text-xs font-medium text-foreground block">
              To confirm, type <span className="font-mono font-bold text-destructive select-all">{expectedText}</span> below:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="w-full h-10 px-3 text-xs font-mono rounded-lg border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-destructive/30"
              placeholder={expectedText}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <GlassButton type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </GlassButton>
            <GlassButton
              type="button"
              variant="danger"
              disabled={!isMatch || loading}
              onClick={() => void handleDelete()}
              className="gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              <span>Permanently Delete</span>
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
}
