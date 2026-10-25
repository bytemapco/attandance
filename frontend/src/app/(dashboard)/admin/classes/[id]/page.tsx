"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Pencil, UserPlus, Users, BookOpen, GraduationCap, MapPin, 
  Hash, LayoutDashboard, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassBadge from "@/components/ui/GlassBadge";
import type { ClassResponse } from "@/types";

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | React.ReactNode }) => (
  <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-md bg-card text-primary border border-border">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <div className="text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
    <ChevronRight size={14} className="text-muted-foreground opacity-60" />
  </div>
);

export default function ClassDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const [cls, setCls] = useState<ClassResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch(): Promise<void> {
      try {
        const { data } = await api.get<ClassResponse>(`/admin/classes/${id}`);
        setCls(data);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load class"));
        setCls(null);
      } finally {
        setLoading(false);
      }
    }
    void fetch();
  }, [id]);

  if (loading) return <GlassLoader text="Loading class details..." />;
  if (!cls) return <div className="text-center py-20 text-muted-foreground text-xs">Class not found</div>;

  return (
    <div className="space-y-6">
      <GlassBreadcrumb items={[
        { label: "Admin", href: "/admin/dashboard" },
        { label: "Classes", href: "/admin/classes" },
        { label: cls.name }
      ]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1 flex items-center gap-2.5">
            {cls.name}
            {cls.semester && <GlassBadge variant="info">Semester {cls.semester}</GlassBadge>}
          </h1>
          <p className="text-xs text-muted-foreground">
            {cls.subject_name} ({cls.subject_code})
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href={`/admin/classes/${id}/edit`}>
            <GlassButton variant="secondary" size="sm" icon={<Pencil size={14} />}>
              Edit Details
            </GlassButton>
          </Link>
          <Link href={`/admin/classes/${id}/enroll`}>
            <GlassButton variant="primary" size="sm" icon={<UserPlus size={14} />}>
              Enroll Students
            </GlassButton>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard padding="none" className="overflow-hidden bg-card">
            <div className="p-4 border-b border-border bg-secondary/30">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BookOpen size={16} className="text-primary" />
                Class Overview
              </h3>
            </div>
            <div className="p-3.5 space-y-2">
              <InfoItem icon={Hash} label="Subject" value={<span>{cls.subject_name} <span className="text-muted-foreground font-normal ml-1">({cls.subject_code})</span></span>} />
              <InfoItem icon={MapPin} label="Location" value={cls.classroom_name || "Unassigned"} />
              <InfoItem 
                icon={GraduationCap} 
                label="Semester & Batch" 
                value={`${cls.semester ? `Semester ${cls.semester}` : "Semester unassigned"} ${cls.batch ? `• Batch ${cls.batch}` : ""}`} 
              />
              <InfoItem icon={LayoutDashboard} label="System Identifier" value={cls.id} />
            </div>
          </GlassCard>
        </div>

        <div className="space-y-5">
          <GlassCard padding="none" className="overflow-hidden bg-card">
            <div className="p-4 border-b border-border bg-secondary/30">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Total Enrollment
              </h3>
            </div>
            <div className="p-5">
              <p className="text-3xl font-bold text-foreground">{cls.enrolled_count}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Enrolled Students</p>
            </div>
          </GlassCard>

          <GlassCard padding="none" className="overflow-hidden bg-card">
            <div className="p-3">
              <Link href={`/admin/classes/${id}/assign-teacher`} className="flex items-center gap-3 w-full p-2.5 rounded-lg border border-border hover:bg-secondary/60 transition-colors">
                <div className="p-2 rounded-md bg-secondary text-primary">
                  <Users size={16} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold text-foreground">Change Teacher</p>
                  <p className="text-[10px] text-muted-foreground">Reassign faculty member</p>
                </div>
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
