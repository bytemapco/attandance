"use client";

import React, { useState } from "react";
import { UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#28363b]/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card border border-[#e3e1dc] rounded-2xl shadow-xl p-6 space-y-5 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#e3e1dc]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#eeece7] text-[#28363b] border border-[#e3e1dc]">
              <UserPlus size={16} />
            </div>
            <h3 className="text-sm font-semibold text-[#28363b]">Add Administrator</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#718087] hover:text-[#202b30] hover:bg-[#eeece7] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <GlassInput
              label="Full Name"
              placeholder="e.g. Dr. Rajesh Patel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <GlassInput
              label="Official Email Address"
              type="email"
              placeholder="e.g. admin.patel@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e3e1dc]">
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
              disabled={submitting || !email.trim() || !name.trim()}
              className="text-xs font-semibold"
            >
              Send Invitation
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}
