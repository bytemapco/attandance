"use client";

import React, { useState } from "react";
import { Mail, X } from "lucide-react";
import toast from "react-hot-toast";
import GlassButton from "@/components/ui/GlassButton";
import { superAdminService } from "@/services/superAdminService";
import { getApiErrorMessage } from "@/lib/api";

interface TenantAdminEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  admin: { id: string; email: string } | null;
  onSuccess: () => void;
}

export default function TenantAdminEditModal({
  isOpen,
  onClose,
  tenantId,
  admin,
  onSuccess,
}: TenantAdminEditModalProps): React.ReactElement | null {
  const [email, setEmail] = useState(admin?.email || "");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (admin) {
      setEmail(admin.email);
    }
  }, [admin]);

  if (!isOpen || !admin) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Email address is required.");
      return;
    }
    if (cleanEmail === admin.email.toLowerCase()) {
      onClose();
      return;
    }

    try {
      setSubmitting(true);
      await superAdminService.updateTenantAdminEmail(tenantId, admin.id, {
        email: cleanEmail,
      });
      toast.success("Administrator email updated successfully");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update administrator email"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 space-y-5 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-secondary text-primary border border-border">
              <Mail size={16} />
            </div>
            <h3 className="text-sm font-semibold text-primary">Edit Administrator Email</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="e.g. administrator@institution.edu"
              className="w-full px-3.5 py-2.5 bg-card border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <GlassButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
              className="text-xs"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={submitting || !email.trim() || email.trim().toLowerCase() === admin.email.toLowerCase()}
              className="text-xs font-semibold"
            >
              Save Changes
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}
