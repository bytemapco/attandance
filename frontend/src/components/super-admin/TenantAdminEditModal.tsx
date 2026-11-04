"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ModalFrame from "@/components/ui/ModalFrame";
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
    <ModalFrame label="Edit administrator email" onClose={onClose} className="space-y-5 p-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="text-base font-semibold text-foreground">Edit administrator email</h3>
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
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="e.g. administrator@institution.edu"
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={submitting || !email.trim() || email.trim().toLowerCase() === admin.email.toLowerCase()}
          >
            Save changes
          </Button>
        </div>
      </form>
    </ModalFrame>
  );
}
