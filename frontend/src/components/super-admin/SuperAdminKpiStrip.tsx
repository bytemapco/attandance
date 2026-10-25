"use client";

import React from "react";
import { Building2, Users, GraduationCap, Radio, CheckCircle2, ShieldAlert } from "lucide-react";
import GlassStatCard from "@/components/ui/GlassStatCard";
import type { SuperAdminStats } from "@/types";

interface SuperAdminKpiStripProps {
  stats: SuperAdminStats | null;
  loading: boolean;
}

export default function SuperAdminKpiStrip({ stats, loading }: SuperAdminKpiStripProps): React.ReactElement {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="h-28 rounded-xl bg-card border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <GlassStatCard
        icon={<Building2 size={16} />}
        label="Total Institutions"
        value={stats.total_tenants}
        accentColor="blue"
      />
      <GlassStatCard
        icon={<CheckCircle2 size={16} />}
        label="Active Tenants"
        value={stats.active_tenants}
        accentColor="emerald"
      />
      <GlassStatCard
        icon={<GraduationCap size={16} />}
        label="Total Students"
        value={stats.total_students}
        accentColor="purple"
      />
      <GlassStatCard
        icon={<Users size={16} />}
        label="Faculty Members"
        value={stats.total_teachers}
        accentColor="amber"
      />
      <GlassStatCard
        icon={<Radio size={16} />}
        label="Live Sessions"
        value={stats.active_sessions ?? (stats as unknown as { active_sessions_now?: number }).active_sessions_now ?? 0}
        accentColor="rose"
      />
      <GlassStatCard
        icon={<ShieldAlert size={16} />}
        label="Total Attendance"
        value={stats.total_attendance ?? (stats as unknown as { today_attendance_records?: number }).today_attendance_records ?? 0}
        accentColor="emerald"
      />
    </div>
  );
}
