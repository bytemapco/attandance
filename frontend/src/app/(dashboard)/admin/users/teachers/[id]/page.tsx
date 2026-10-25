"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Pencil, Mail, Building2, Briefcase, User, Phone, Award,
  Hash, CheckCircle, ChevronRight, KeyRound
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

const colorVariants: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border border-blue-200/60",
  purple: "bg-purple-50 text-purple-700 border border-purple-200/60",
  amber: "bg-amber-50 text-amber-700 border border-amber-200/60",
  emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
  rose: "bg-rose-50 text-rose-700 border border-rose-200/60",
  orange: "bg-orange-50 text-orange-700 border border-orange-200/60",
  cyan: "bg-cyan-50 text-cyan-700 border border-cyan-200/60",
  indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200/60",
  slate: "bg-slate-100 text-slate-700 border border-slate-200/60",
};

const InfoItem = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string, color: string }) => (
  <div className="group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/40 transition-colors">
    <div className="flex items-center gap-3.5">
      <div className={`p-2.5 rounded-xl ${colorVariants[color] || colorVariants.slate} transition-transform`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
    <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
  </div>
);

export default function TeacherDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [teacher, setTeacher] = useState<TeacherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

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

  if (loading) return <GlassLoader text="Loading teacher details..." />;
  if (!teacher) return <div className="text-center py-20 text-slate-500">Teacher not found</div>;

  const fullName = `${teacher.first_name} ${teacher.last_name}`;
  const initials = (teacher.first_name?.[0] || "") + (teacher.last_name?.[0] || "");

  return (
    <div className="animate-fade-in-up space-y-8">
      <GlassBreadcrumb items={[
        { label: "Admin", href: "/admin/dashboard" },
        { label: "Teachers", href: "/admin/users/teachers" },
        { label: fullName },
      ]} />
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex-shrink-0 relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-3xl shadow-xs">
              {initials || <User size={36} className="text-muted-foreground" />}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-background border border-border text-emerald-600 p-1.5 rounded-full shadow-xs">
              <CheckCircle size={16} />
            </div>
          </div>
          
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1.5">
                {fullName}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <GlassBadge variant="success">{teacher.employee_id}</GlassBadge>
                <GlassBadge variant="info">{teacher.department}</GlassBadge>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted px-2.5 py-0.5 rounded-full border border-border">
                  <Award size={12} /> Faculty
                </span>
              </div>
            </div>
            
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              Faculty profile containing professional credentials, department affiliations, and contact records. Manage administrative access and academic assignments from this panel.
            </p>
            
            <div className="pt-2 flex flex-wrap gap-3 justify-center sm:justify-start">
              <GlassButton variant="primary" icon={<Pencil size={16} />} onClick={() => router.push(`/admin/users/teachers/${id}/edit`)}>
                Edit Profile
              </GlassButton>
              <GlassButton variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" icon={<KeyRound size={16} />} onClick={() => setIsResetDialogOpen(true)}>
                Reset Password
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="!p-0 overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/40">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <User size={18} className="text-primary" />
              Personal Information
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Direct contact and identity details.</p>
          </div>
          <div className="p-3 space-y-1">
            <InfoItem icon={Mail} label="Email Address" value={teacher.email} color="blue" />
            <InfoItem icon={Phone} label="Phone Number" value={teacher.phone || "Not provided"} color="purple" />
            <InfoItem icon={Hash} label="Employee ID" value={teacher.employee_id} color="amber" />
          </div>
        </GlassCard>

        <GlassCard className="!p-0 overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/40">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Briefcase size={18} className="text-primary" />
              Institutional Assignment
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Departmental and role configuration.</p>
          </div>
          <div className="p-3 space-y-1">
            <InfoItem icon={Building2} label="Department" value={teacher.department} color="rose" />
            <InfoItem icon={Briefcase} label="Designation" value={teacher.designation} color="orange" />
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
