"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

interface TeacherDashboardHeaderProps {
  todayStr: string;
  onRefresh: () => void;
}

export default function TeacherDashboardHeader({
  todayStr,
  onRefresh,
}: TeacherDashboardHeaderProps): React.ReactElement {
  const { user } = useAuthStore();
  const profile = user?.teacher_profile;

  return (
    <div className="rounded-lg border border-border bg-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{todayStr}</span>
          <span className="text-border text-xs">•</span>
          {user?.tenant_name && (
            <span className="text-xs font-semibold text-muted-foreground">
              {user.tenant_name}
            </span>
          )}
          {profile?.department && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary text-foreground border border-border">
              {profile.department}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
        <Button variant="secondary" icon={<RefreshCw size={14} />} onClick={onRefresh}>
          Refresh
        </Button>
      </div>
    </div>
  );
}
