"use client";

import React, { useState } from "react";
import { UserPlus, UserCheck, KeyRound, Mail } from "lucide-react";
import toast from "react-hot-toast";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassResetPasswordDialog from "@/components/ui/GlassResetPasswordDialog";
import { superAdminService } from "@/lib/services/superAdminService";
import { getApiErrorMessage } from "@/lib/api";
import type { TenantDetail } from "@/types/tenant";

interface TenantAdminsTabProps {
  tenant: TenantDetail;
  onRefresh: () => void;
}

export default function TenantAdminsTab({
  tenant,
  onRefresh,
}: TenantAdminsTabProps): React.ReactElement {
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const role = "TENANT_ADMIN";
  const [submitting, setSubmitting] = useState(false);
  const [adminToReset, setAdminToReset] = useState<{ id: string; email: string } | null>(null);

  const handleAddAdmin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setSubmitting(true);
    try {
      await superAdminService.addTenantAdmin(tenant.id, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      });
      toast.success(`Administrator created! Invitation setup email sent to ${email.trim().toLowerCase()}`);
      setName("");
      setEmail("");
      setShowAddAdmin(false);
      onRefresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create administrator"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResetEmail = async (): Promise<void> => {
    if (!adminToReset) return;
    try {
      await superAdminService.triggerPasswordReset(adminToReset.id);
      toast.success(`Password reset email sent to ${adminToReset.email}`);
      setAdminToReset(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send password reset email"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Administrators</h3>
          <p className="text-xs text-muted-foreground">
            Manage administrators for this institution. Setup links are sent by email.
          </p>
        </div>
        <GlassButton variant="primary" onClick={() => setShowAddAdmin(!showAddAdmin)} className="gap-1.5">
          <UserPlus size={14} />
          <span>{showAddAdmin ? "Cancel" : "Add Administrator"}</span>
        </GlassButton>
      </div>

      {showAddAdmin && (
        <form onSubmit={handleAddAdmin} className="bg-card border border-primary/30 rounded-xl p-5 space-y-4 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">New Administrator</h4>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Mail size={12} className="text-primary" /> Setup link sent via email
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className="flex justify-end gap-2 pt-1">
            <GlassButton variant="secondary" onClick={() => setShowAddAdmin(false)}>Cancel</GlassButton>
            <GlassButton variant="primary" loading={submitting} disabled={submitting}>
              Send Invitation & Create Admin
            </GlassButton>
          </div>
        </form>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Administrator Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(tenant.admin_users || []).map((admin) => (
              <tr key={admin.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                  <UserCheck size={14} className="text-primary" />
                  <span>{admin.email}</span>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{admin.role}</td>
                <td className="px-4 py-3">
                  <GlassBadge variant={admin.is_active !== false ? "success" : "danger"}>
                    {admin.is_active !== false ? "ACTIVE" : "DISABLED"}
                  </GlassBadge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setAdminToReset({ id: admin.id, email: admin.email })}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    <KeyRound size={12} />
                    <span>Send Reset Email</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <GlassResetPasswordDialog
        isOpen={Boolean(adminToReset)}
        onClose={() => setAdminToReset(null)}
        onConfirm={handleSendResetEmail}
        userEmail={adminToReset?.email}
        title="Send Administrator Password Reset Link"
      />
    </div>
  );
}
