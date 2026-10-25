"use client";

import React from "react";
import { GraduationCap, Users, Radio, Building2, ShieldCheck } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import type { TenantDetail } from "@/types/tenant";

interface TenantMetricsRowProps {
  tenant: TenantDetail;
  studentCount: number;
  teacherCount: number;
  totalUsers: number;
  licenseCount: number;
  remainingSeats: number;
  capacityPct: number;
}

export default function TenantMetricsRow({
  tenant,
  studentCount,
  teacherCount,
  totalUsers,
  licenseCount,
  remainingSeats,
  capacityPct,
}: TenantMetricsRowProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Students Card */}
      <GlassCard className="p-4 flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Students</p>
            <p className="text-2xl font-bold text-foreground">
              {studentCount.toLocaleString()}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Faculty Card */}
      <GlassCard className="p-4 flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Faculty Members</p>
            <p className="text-2xl font-bold text-foreground">
              {teacherCount.toLocaleString()}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* License Usage Card */}
      <GlassCard className="p-4 flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">License Quota</p>
            <p className="text-xl font-bold text-foreground">
              {totalUsers.toLocaleString()} / {licenseCount.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-2.5">
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                capacityPct > 90 ? "bg-red-500" : capacityPct > 70 ? "bg-amber-500" : "bg-primary"
              }`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
            <span>{remainingSeats.toLocaleString()} left</span>
            <span>{capacityPct}%</span>
          </div>
        </div>
      </GlassCard>

      {/* Academic Structure Card */}
      <GlassCard className="p-4 flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Academics</p>
            <p className="text-2xl font-bold text-foreground">
              {tenant.department_count || 0} Depts
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Attendance Activity Card */}
      <GlassCard className="p-4 flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
            <Radio size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Live Sessions</p>
            <p className="text-2xl font-bold text-foreground">
              {tenant.active_sessions_count || 0}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
