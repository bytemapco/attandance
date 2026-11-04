"use client";

import React from "react";
import { GraduationCap, Users, Radio, Building2, ShieldCheck } from "lucide-react";
import Card from "@/components/ui/Card";
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
      <Card className="p-4 flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-secondary text-muted-foreground border border-border">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Students</p>
            <p className="text-2xl font-semibold text-foreground">
              {studentCount.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Faculty Card */}
      <Card className="p-4 flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-accent-soft text-accent-strong border border-accent-border">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Faculty</p>
            <p className="text-2xl font-semibold text-foreground">
              {teacherCount.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* License Usage Card */}
      <Card className="p-4 flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-secondary text-primary border border-border">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">License Quota</p>
            <p className="text-xl font-semibold text-foreground">
              {totalUsers.toLocaleString()} / {licenseCount.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-2.5">
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                capacityPct > 90 ? "bg-destructive" : capacityPct > 70 ? "bg-warning" : "bg-primary"
              }`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
            <span>{remainingSeats.toLocaleString()} left</span>
            <span>{capacityPct}%</span>
          </div>
        </div>
      </Card>

      {/* Academic Structure Card */}
      <Card className="p-4 flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-secondary text-muted-foreground border border-border">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Academics</p>
            <p className="text-2xl font-semibold text-foreground">
              {tenant.department_count || 0} Depts
            </p>
          </div>
        </div>
      </Card>

      {/* Attendance Activity Card */}
      <Card className="p-4 flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-success-soft text-success border border-success-border">
            <Radio size={20} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Live Sessions</p>
            <p className="text-2xl font-semibold text-foreground">
              {tenant.active_sessions_count || 0}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
