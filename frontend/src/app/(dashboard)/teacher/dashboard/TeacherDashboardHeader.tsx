"use client";

import React from "react";
import Link from "next/link";
import { Radio, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

interface TeacherDashboardHeaderProps {
  todayStr: string;
  refreshing: boolean;
  onRefresh: () => void;
}

export default function TeacherDashboardHeader({
  todayStr,
  refreshing,
  onRefresh,
}: TeacherDashboardHeaderProps): React.ReactElement {
  const { user } = useAuthStore();
  const profile = user?.teacher_profile;
  const teacherName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : user?.email?.split("@")[0] || "Teacher";

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="rounded-2xl border border-[#e3e1dc] bg-card p-5 sm:p-6 shadow-[0_2px_8px_rgba(40,54,59,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[#526f78]">{todayStr}</span>
          <span className="text-[#e3e1dc] text-xs">•</span>
          {user?.tenant_name && (
            <span className="text-[11px] font-semibold text-[#526f78]">
              {user.tenant_name}
            </span>
          )}
          {profile?.department && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-[#202b30] border border-[#e3e1dc]">
              {profile.department}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#28363b]">
          {greeting}, {teacherName}
        </h1>
      </div>

      <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
        <Link
          href="/teacher/sessions"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#28363b] text-white text-xs font-semibold hover:bg-[#1f2b2f] transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <Radio size={14} className="text-[#c98260]" />
          <span>Start Session</span>
        </Link>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[#e3e1dc] bg-card text-xs font-semibold text-[#202b30] hover:bg-secondary transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw
            size={13}
            className={refreshing ? "animate-spin text-[#c98260]" : "text-[#526f78]"}
          />
          <span>{refreshing ? "Updating..." : "Refresh"}</span>
        </button>
      </div>
    </div>
  );
}
