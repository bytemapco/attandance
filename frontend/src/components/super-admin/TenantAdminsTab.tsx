"use client";

import React, { useState } from "react";
import { UserPlus, UserCheck, KeyRound, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import GlassButton from "@/components/ui/GlassButton";
import GlassResetPasswordDialog from "@/components/ui/GlassResetPasswordDialog";
import GlassConfirmDialog from "@/components/ui/GlassConfirmDialog";
import TenantAdminEditModal from "@/components/super-admin/TenantAdminEditModal";
import TenantAdminCreateModal from "@/components/super-admin/TenantAdminCreateModal";
import { superAdminService } from "@/services/superAdminService";
import { getApiErrorMessage } from "@/lib/api";
import type { TenantDetail } from "@/types/tenant";

interface TenantAdminsTabProps {
  tenant: TenantDetail;
  onRefresh: () => void;
}

export default function TenantAdminsTab({ tenant, onRefresh }: TenantAdminsTabProps): React.ReactElement {
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminToReset, setAdminToReset] = useState<{ id: string; email: string } | null>(null);
  const [adminToEdit, setAdminToEdit] = useState<{ id: string; email: string } | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<{ id: string; email: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const admins = tenant.admin_users || [];

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

  const handleDeleteAdmin = async (): Promise<void> => {
    if (!adminToDelete) return;
    setDeleting(true);
    try {
      await superAdminService.deleteTenantAdmin(tenant.id, adminToDelete.id);
      toast.success("Administrator removed successfully");
      setAdminToDelete(null);
      onRefresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to remove administrator"));
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (adminId: string, currentStatus: boolean): Promise<void> => {
    setTogglingId(adminId);
    try {
      await superAdminService.setTenantAdminStatus(adminId, !currentStatus);
      toast.success(`Administrator ${!currentStatus ? "activated" : "deactivated"}`);
      onRefresh();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update administrator status"));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#28363b]">Administrators</h3>
          <p className="text-xs text-[#526f78]">Manage administrators for this institution. Setup links are sent by email.</p>
        </div>
        <GlassButton variant="primary" onClick={() => setShowAddAdmin(true)} className="gap-1.5 text-xs">
          <UserPlus size={14} />
          <span>Add Administrator</span>
        </GlassButton>
      </div>

      <div className="bg-card border border-[#e3e1dc] rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#eeece7]/60 border-b border-[#e3e1dc] text-[11px] font-semibold text-[#526f78] uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Administrator Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3e1dc]">
            {admins.map((admin) => {
              const isActive = admin.is_active !== false;
              return (
                <tr key={admin.id} className="hover:bg-[#eeece7]/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#202b30] flex items-center gap-2">
                    <UserCheck size={14} className="text-[#526f78]" />
                    <span>{admin.email}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#526f78]">{admin.role}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void handleToggleStatus(admin.id, isActive)}
                      disabled={togglingId === admin.id}
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border cursor-pointer transition-colors ${
                        isActive
                          ? "bg-[#e8f3ed] text-[#247653] border-[#247653]/30 hover:bg-[#e8f3ed]/70"
                          : "bg-[#f9eaea] text-[#b54242] border-[#b54242]/30 hover:bg-[#f9eaea]/70"
                      }`}
                      title={isActive ? "Click to deactivate" : "Click to activate"}
                    >
                      {isActive ? "ACTIVE" : "DISABLED"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => setAdminToEdit({ id: admin.id, email: admin.email })}
                        className="inline-flex items-center gap-1 text-xs text-[#526f78] hover:text-[#202b30] font-medium px-1.5 py-1 rounded hover:bg-[#eeece7] transition-colors cursor-pointer"
                        title="Edit email"
                      >
                        <Pencil size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminToReset({ id: admin.id, email: admin.email })}
                        className="inline-flex items-center gap-1 text-xs text-[#526f78] hover:text-[#202b30] font-medium px-1.5 py-1 rounded hover:bg-[#eeece7] transition-colors cursor-pointer"
                        title="Send reset password email"
                      >
                        <KeyRound size={13} />
                        <span>Reset</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminToDelete({ id: admin.id, email: admin.email })}
                        className="inline-flex items-center gap-1 text-xs text-[#b54242] hover:bg-[#f9eaea] font-medium px-1.5 py-1 rounded transition-colors cursor-pointer"
                        title="Delete administrator"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TenantAdminCreateModal
        isOpen={showAddAdmin}
        onClose={() => setShowAddAdmin(false)}
        tenantId={tenant.id}
        onSuccess={onRefresh}
      />
      <TenantAdminEditModal
        isOpen={Boolean(adminToEdit)}
        onClose={() => setAdminToEdit(null)}
        tenantId={tenant.id}
        admin={adminToEdit}
        onSuccess={onRefresh}
      />
      <GlassConfirmDialog
        isOpen={Boolean(adminToDelete)}
        title="Remove Administrator"
        message={`Are you sure you want to permanently remove administrator '${adminToDelete?.email}' from ${tenant.name}? This action cannot be undone.`}
        confirmLabel="Remove Administrator"
        onConfirm={() => void handleDeleteAdmin()}
        onCancel={() => setAdminToDelete(null)}
        loading={deleting}
      />
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
