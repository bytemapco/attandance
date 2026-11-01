"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Pencil, Mail, Building2, Briefcase, User, Phone,
  Hash, KeyRound, Copy, Check
} from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassResetPasswordDialog from "@/components/ui/GlassResetPasswordDialog";
import type { TeacherResponse } from "@/types";

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  copyValue?: string;
  copyKey?: string;
  copiedKey?: string | null;
  onCopy?: (text: string, key: string) => void;
}

const InfoRow = ({
  icon: Icon,
  label,
  value,
  copyValue,
  copyKey,
  copiedKey,
  onCopy,
}: InfoRowProps) => (
  <div className="group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-border/60 hover:bg-muted/40 transition-colors">
    <div className="flex items-center gap-3.5 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center text-[#526f78] shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
    {copyValue && copyKey && onCopy && (
      <button
        type="button"
        onClick={() => onCopy(copyValue, copyKey)}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-md hover:bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        title={`Copy ${label}`}
        aria-label={`Copy ${label}`}
      >
        {copiedKey === copyKey ? (
          <Check size={14} className="text-[#247653]" />
        ) : (
          <Copy size={14} />
        )}
      </button>
    )}
  </div>
);

export default function TeacherDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [teacher, setTeacher] = useState<TeacherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    async function fetch(): Promise<void> {
      try {
        const { data } = await api.get<TeacherResponse>(`/admin/users/teachers/${id}`);
        setTeacher(data);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load teacher"));
        setTeacher(null);
      } finally {
        setLoading(false);
      }
    }
    void fetch();
  }, [id]);

  const copyToClipboard = async (text: string, label: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleResetPassword = async (): Promise<void> => {
    if (!teacher) return;
    try {
      await api.post(`/admin/users/${teacher.user_id}/reset-password`);
      toast.success(`Password reset email sent to ${teacher.email}`);
      setIsResetDialogOpen(false);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to send password reset email"));
    }
  };

  if (loading) return <GlassLoader text="Loading faculty details..." />;
  if (!teacher) return <div className="text-center py-20 text-muted-foreground">Faculty member not found</div>;

  const fullName = `${teacher.first_name} ${teacher.last_name}`;
  const initials = (teacher.first_name?.[0] || "") + (teacher.last_name?.[0] || "");

  return (
    <div className="animate-fade-in-up space-y-6">
      <GlassBreadcrumb items={[
        { label: "Admin", href: "/admin/dashboard" },
        { label: "Teachers", href: "/admin/users/teachers" },
        { label: fullName },
      ]} />
      
      {/* Profile Overview Header */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-[0_2px_8px_rgba(40,54,59,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-left">
            <div className="relative">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-[#28363b]/5 border border-[#28363b]/10 flex items-center justify-center text-[#28363b] font-bold text-2xl sm:text-3xl shadow-xs select-none">
                {initials || <User size={32} className="text-muted-foreground" />}
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  {fullName}
                </h1>
                <GlassBadge 
                  variant="info"
                  icon={<span className="w-1.5 h-1.5 rounded-full bg-[#306b8a]" />}
                >
                  Faculty
                </GlassBadge>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => copyToClipboard(teacher.employee_id, "Employee ID")}
                  className="inline-flex items-center gap-1.5 font-mono px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors cursor-pointer"
                  title="Click to copy employee ID"
                >
                  <Hash size={12} className="text-[#526f78]" />
                  <span>{teacher.employee_id}</span>
                  {copiedField === "Employee ID" ? (
                    <Check size={12} className="text-[#247653]" />
                  ) : (
                    <Copy size={12} className="text-muted-foreground opacity-60" />
                  )}
                </button>

                {teacher.department && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 text-foreground border border-border/80">
                    <Building2 size={12} className="text-[#526f78]" />
                    {teacher.department}
                  </span>
                )}

                {teacher.designation && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 text-foreground border border-border/80">
                    <Briefcase size={12} className="text-[#526f78]" />
                    {teacher.designation}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-center sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
            <GlassButton 
              variant="primary" 
              size="md"
              icon={<Pencil size={15} />} 
              onClick={() => router.push(`/admin/users/teachers/${id}/edit`)}
            >
              Edit Profile
            </GlassButton>
            <GlassButton 
              variant="secondary" 
              size="md"
              icon={<KeyRound size={15} className="text-[#526f78]" />} 
              onClick={() => setIsResetDialogOpen(true)}
            >
              Reset Password
            </GlassButton>
          </div>
        </div>
      </div>
      
      {/* Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Institutional Assignment */}
        <GlassCard className="!p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2.5">
              <Briefcase size={17} className="text-[#526f78]" />
              Institutional Assignment
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              Department & Role
            </span>
          </div>
          <div className="p-4 space-y-1">
            <InfoRow 
              icon={Hash} 
              label="Employee ID" 
              value={teacher.employee_id} 
              copyValue={teacher.employee_id}
              copyKey="Employee ID"
              copiedKey={copiedField}
              onCopy={copyToClipboard}
            />
            <InfoRow 
              icon={Building2} 
              label="Department" 
              value={teacher.department || "Not assigned"} 
            />
            <InfoRow 
              icon={Briefcase} 
              label="Designation" 
              value={teacher.designation || "Not assigned"} 
            />
          </div>
        </GlassCard>

        {/* Personal Information */}
        <GlassCard className="!p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2.5">
              <User size={17} className="text-[#526f78]" />
              Personal Information
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              Contact & Identity
            </span>
          </div>
          <div className="p-4 space-y-1">
            <InfoRow 
              icon={Mail} 
              label="Email Address" 
              value={teacher.email} 
              copyValue={teacher.email}
              copyKey="Email"
              copiedKey={copiedField}
              onCopy={copyToClipboard}
            />
            <InfoRow 
              icon={Phone} 
              label="Phone Number" 
              value={teacher.phone || "Not provided"} 
              copyValue={teacher.phone || undefined}
              copyKey="Phone"
              copiedKey={copiedField}
              onCopy={copyToClipboard}
            />
          </div>
        </GlassCard>
      </div>

      <GlassResetPasswordDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetPassword}
        userEmail={teacher.email}
        title="Send Password Reset Email"
      />
    </div>
  );
}
