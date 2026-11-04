"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ModalFrame from "@/components/ui/ModalFrame";
import { superAdminService } from "@/services/superAdminService";
import { getApiErrorMessage } from "@/lib/api";

interface TenantAdminCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
}

export default function TenantAdminCreateModal({
  isOpen,
  onClose,
  tenantId,
  onSuccess,
}: TenantAdminCreateModalProps): React.ReactElement | null {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setSubmitting(true);
    try {
      const createdAdmin = await superAdminService.addTenantAdmin(tenantId, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: "TENANT_ADMIN",
      });
      if (createdAdmin.invitation_sent) {
        toast.success(`Administrator created. Invitation sent to ${createdAdmin.email}`);
      } else {
        toast.error(`Administrator created, but the invitation could not be sent to ${createdAdmin.email}. Check SMTP settings, then use Send Password Reset.`);
      }
      setName("");
      setEmail("");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create administrator"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalFrame label="Add administrator" onClose={onClose} className="space-y-5 p-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="text-base font-semibold text-foreground">Add administrator</h3>
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
        <div className="space-y-3">
          <Input
            label="Full Name"
            placeholder="e.g. Dr. Rajesh Patel"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Official Email Address"
            type="email"
            placeholder="e.g. admin.patel@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

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
            disabled={submitting || !email.trim() || !name.trim()}
          >
            Send invitation
          </Button>
        </div>
      </form>
    </ModalFrame>
  );
}
