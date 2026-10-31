"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Pencil, Mail, Hash, User, Phone, GraduationCap, Building2, CalendarDays, 
  MapPin, Clock, Award, ShieldCheck, GitBranch, KeyRound
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

const colorVariants: Record<string, string> = {
  blue: "bg-[#eaf2f6] text-[#306b8a] border border-[#c5dce8]",
  purple: "bg-[#eeece7] text-[#526f78] border border-[#e3e1dc]",
  pink: "bg-[#f7efea] text-[#c98260] border border-[#f0ded4]",
  amber: "bg-[#fbf1df] text-[#8a5b12] border border-[#f2deba]",
  emerald: "bg-[#e8f3ed] text-[#247653] border border-[#c6e2d3]",
  rose: "bg-[#f9eaea] text-[#b54242] border border-[#f0c9c9]",
  cyan: "bg-[#eaf2f6] text-[#306b8a] border border-[#c5dce8]",
  slate: "bg-[#eeece7] text-[#526f78] border border-[#e3e1dc]",
};

const InfoItem = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string, color: string }) => (
  <div className="flex items-center justify-between p-3 rounded-lg border border-transparent">
    <div className="flex items-center gap-3.5">
      <div className={`p-2.5 rounded-xl ${colorVariants[color] || colorVariants.slate}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  </div>
);

export default function StudentDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

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
    <div className="animate-fade-in-up space-y-8">
      <GlassBreadcrumb items={[
        { label: "Admin", href: "/admin/dashboard" },
        { label: "Students", href: "/admin/users/students" },
        { label: fullName !== "Not provided" ? fullName : student.email },
      ]} />
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex-shrink-0 relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-3xl shadow-xs">
              {initials || <User size={36} className="text-muted-foreground" />}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-background border border-border text-emerald-600 p-1.5 rounded-full shadow-xs">
              <ShieldCheck size={16} />
            </div>
          </div>
          
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1.5">
                {fullName}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <GlassBadge variant="info">{student.enrollment_number}</GlassBadge>
                {student.department_name && <GlassBadge variant="success">{student.department_name}</GlassBadge>}
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted px-2.5 py-0.5 rounded-full border border-border">
                  <Clock size={12} /> Enrolled
                </span>
              </div>
            </div>
            
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              Student profile containing academic records, personal information, and system access details. Ensure all modifications align with institutional data policies.
            </p>
            
            <div className="pt-2 flex flex-wrap gap-3 justify-center sm:justify-start">
              <GlassButton variant="primary" icon={<Pencil size={16} />} onClick={() => router.push(`/admin/users/students/${id}/edit`)}>
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
            <p className="text-xs text-muted-foreground mt-0.5">Contact details and identity information.</p>
          </div>
          <div className="p-3 space-y-1">
            <InfoItem icon={Mail} label="Email Address" value={student.email} color="blue" />
            <InfoItem icon={Phone} label="Phone Number" value={student.phone || "Not provided"} color="purple" />
            <InfoItem icon={User} label="Gender" value={student.gender || "Unspecified"} color="pink" />
            <InfoItem 
              icon={CalendarDays} 
              label="Date of Birth" 
              value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Not provided"} 
              color="amber" 
            />
          </div>
        </GlassCard>

        <GlassCard className="!p-0 overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/40">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <GraduationCap size={18} className="text-primary" />
              Academic Profile
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Institutional enrollment and course tracking.</p>
          </div>
          <div className="p-3 space-y-1">
            <InfoItem icon={Hash} label="Enrollment Number" value={student.enrollment_number} color="emerald" />
            <InfoItem icon={Building2} label="Department" value={student.department_name || "Not assigned"} color="rose" />
            <InfoItem icon={GitBranch} label="Branch" value={student.branch || "Not provided"} color="blue" />
            <InfoItem 
              icon={Award} 
              label="Semester & Batch" 
              value={`${student.semester ? `Semester ${student.semester}` : "Semester unassigned"} ${student.batch ? `• Batch ${student.batch}` : ""}`} 
              color="cyan" 
            />
            <InfoItem icon={MapPin} label="System Identifier" value={student.id} color="slate" />
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
