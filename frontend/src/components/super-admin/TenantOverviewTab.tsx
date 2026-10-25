"use client";

import React from "react";
import { Globe, UserCheck, CheckCircle2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassBadge from "@/components/ui/GlassBadge";
import TenantMetricsRow from "./TenantMetricsRow";
import type { TenantDetail } from "@/types/tenant";

interface TenantOverviewTabProps {
  tenant: TenantDetail;
}

export default function TenantOverviewTab({ tenant }: TenantOverviewTabProps): React.ReactElement {
  const studentCount = tenant.student_count || 0;
  const teacherCount = tenant.teacher_count || 0;
  const totalUsers = studentCount + teacherCount;
  const licenseCount = tenant.license_count || 1;
  const remainingSeats = Math.max(0, licenseCount - totalUsers);
  const capacityPct = Math.min(100, Math.round((totalUsers / licenseCount) * 100));

  const admins = tenant.admin_users || [];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Quick Metrics Grid */}
      <TenantMetricsRow
        tenant={tenant}
        studentCount={studentCount}
        teacherCount={teacherCount}
        totalUsers={totalUsers}
        licenseCount={licenseCount}
        remainingSeats={remainingSeats}
        capacityPct={capacityPct}
      />

      {/* Details & Administration Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Access & Domain Routing Card */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Globe size={16} className="text-primary" />
              <span>Access & Web Routing</span>
            </h3>
            <GlassBadge variant={tenant.domain ? "success" : "neutral"}>
              {tenant.domain ? "Custom Domain" : "Standard Slug"}
            </GlassBadge>
          </div>

          <div className="p-3.5 bg-muted/40 rounded-xl border border-border space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Default Portal URL:</span>
              <span className="font-mono text-foreground font-semibold">
                /login?tenant={tenant.slug}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Custom Domain:</span>
              <span className="font-mono text-primary font-semibold">
                {tenant.domain || "Not configured"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Institution Identifier:</span>
              <span className="font-mono text-muted-foreground">{tenant.slug}</span>
            </div>
          </div>
        </GlassCard>

        {/* Primary Administrators Card */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <UserCheck size={16} className="text-primary" />
              <span>Primary Administrators</span>
            </h3>
            <span className="text-xs text-muted-foreground font-medium">
              {admins.length} registered
            </span>
          </div>

          {admins.length === 0 ? (
            <div className="p-4 text-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
              No administrator assigned yet. Add one in the Administrators tab.
            </div>
          ) : (
            <div className="space-y-2">
              {admins.slice(0, 3).map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/20 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">{admin.email}</p>
                    <p className="text-[11px] text-muted-foreground">{admin.role}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                    <CheckCircle2 size={13} />
                    <span>{admin.is_active !== false ? "Active" : "Suspended"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
