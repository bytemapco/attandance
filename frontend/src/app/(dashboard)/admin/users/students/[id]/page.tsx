"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Pencil, Mail, Hash, User, Phone, GraduationCap, Building2, CalendarDays,
  KeyRound, Layers, Copy, Check
} from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassResetPasswordDialog from "@/components/ui/GlassResetPasswordDialog";
import type { StudentResponse } from "@/types";

const GENDER_LABELS: Record<string, string> = { M: "Male", F: "Female", O: "Other" };

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

export default function StudentDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStudent(): Promise<void> {
      try {
        const { data } = await api.get<StudentResponse>(`/admin/users/students/${id}`);
        setStudent(data);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load student"));
        setStudent(null);
      } finally {
        setLoading(false);
      }
    }
    void fetchStudent();
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
    if (!student) return;
    try {
      await api.post(`/admin/users/${student.user_id}/reset-password`);
      toast.success(`Password reset email sent to ${student.email}`);
      setIsResetDialogOpen(false);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to send password reset email"));
    }
  };

  if (loading) return <GlassLoader text="Loading student details..." />;
  if (!student) return <div className="text-center py-20 text-muted-foreground">Student not found</div>;

  const fullName = student.first_name && student.last_name 
    ? `${student.first_name} ${student.last_name}` 
    : student.first_name || student.last_name || "Not provided";

  const initials = (student.first_name?.[0] || "") + (student.last_name?.[0] || "");

  return (
    <div className="animate-fade-in-up space-y-6">
      <GlassBreadcrumb items={[
        { label: "Admin", href: "/admin/dashboard" },
        { label: "Students", href: "/admin/users/students" },
        { label: fullName !== "Not provided" ? fullName : student.email },
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
                  variant={student.is_active === false ? "neutral" : "success"}
                  icon={<span className={`w-1.5 h-1.5 rounded-full ${student.is_active === false ? "bg-muted-foreground" : "bg-[#247653]"}`} />}
                >
                  {student.is_active === false ? "Inactive" : "Enrolled"}
                </GlassBadge>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => copyToClipboard(student.enrollment_number, "Enrollment Number")}
                  className="inline-flex items-center gap-1.5 font-mono px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted text-foreground border border-border transition-colors cursor-pointer"
                  title="Click to copy enrollment number"
                >
                  <Hash size={12} className="text-[#526f78]" />
                  <span>{student.enrollment_number}</span>
                  {copiedField === "Enrollment Number" ? (
                    <Check size={12} className="text-[#247653]" />
                  ) : (
                    <Copy size={12} className="text-muted-foreground opacity-60" />
                  )}
                </button>

                {student.department_name && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 text-foreground border border-border/80">
                    <Building2 size={12} className="text-[#526f78]" />
                    {student.department_name}
                  </span>
                )}

                {(student.semester || student.batch) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 text-foreground border border-border/80">
                    <Layers size={12} className="text-[#526f78]" />
                    {[
                      student.semester ? `Semester ${student.semester}` : null,
                      student.batch ? `Batch ${student.batch}` : null,
                    ].filter(Boolean).join(" • ")}
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
              onClick={() => router.push(`/admin/users/students/${id}/edit`)}
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
        {/* Academic Details */}
        <GlassCard className="!p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2.5">
              <GraduationCap size={17} className="text-[#526f78]" />
              Academic Profile
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              Institutional Records
            </span>
          </div>
          <div className="p-4 space-y-1">
            <InfoRow 
              icon={Hash} 
              label="Enrollment Number" 
              value={student.enrollment_number} 
              copyValue={student.enrollment_number}
              copyKey="Enrollment Number"
              copiedKey={copiedField}
              onCopy={copyToClipboard}
            />
            <InfoRow 
              icon={Building2} 
              label="Department" 
              value={student.department_name || "Not assigned"} 
            />
            <InfoRow 
              icon={Layers} 
              label="Current Semester" 
              value={student.semester ? `Semester ${student.semester}` : "Not assigned"} 
            />
            <InfoRow 
              icon={GraduationCap} 
              label="Assigned Batch" 
              value={student.batch ? `Batch ${student.batch}` : "Not assigned"} 
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
              value={student.email} 
              copyValue={student.email}
              copyKey="Email"
              copiedKey={copiedField}
              onCopy={copyToClipboard}
            />
            <InfoRow 
              icon={Phone} 
              label="Phone Number" 
              value={student.phone || "Not provided"} 
              copyValue={student.phone || undefined}
              copyKey="Phone"
              copiedKey={copiedField}
              onCopy={copyToClipboard}
            />
            <InfoRow 
              icon={User} 
              label="Gender" 
              value={(student.gender && GENDER_LABELS[student.gender]) || "Not specified"} 
            />
            <InfoRow 
              icon={CalendarDays} 
              label="Date of Birth" 
              value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : "Not provided"} 
            />
          </div>
        </GlassCard>
      </div>

      <GlassResetPasswordDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetPassword}
        userEmail={student.email}
        title="Send Password Reset Email"
      />
    </div>
  );
}
