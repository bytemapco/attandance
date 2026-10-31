"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, GraduationCap, BookOpen, ShieldCheck, RefreshCw, Megaphone 
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import GlassStatCard from "@/components/ui/GlassStatCard";
import GlassLoader from "@/components/ui/GlassLoader";
import AdminQuickActions from "@/components/admin/AdminQuickActions";
import type { AdminStatsResponse } from "@/types";

export default function AdminDashboardPage(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const displayName = (() => {
    if (user?.teacher_profile?.first_name) {
      return `${user.teacher_profile.first_name} ${user.teacher_profile.last_name || ""}`.trim();
    }
    if (user?.student_profile?.first_name) {
      return `${user.student_profile.first_name} ${user.student_profile.last_name || ""}`.trim();
    }
    if (user?.email) {
      const handle = user.email.split("@")[0].replace(/[._-]/g, " ");
      return handle
        .split(" ")
        .filter(Boolean)
        .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
        .join(" ");
    }
    return "Administrator";
  })();

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const fetchDashboardData = useCallback(async (): Promise<void> => {
    try {
      const statsRes = await api.get<AdminStatsResponse>("/admin/stats");
      setStats(statsRes.data);
    } catch {
      toast.error("Failed to load dashboard metrics");
      setStats({ studentCount: 0, teacherCount: 0, classCount: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  if (loading) return <GlassLoader />;

  return (
    <div className="space-y-6 pb-6">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#e3e1dc] bg-card p-5 sm:p-6 shadow-[0_2px_8px_rgba(40,54,59,0.05)] flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-1 z-10">
          <p className="text-xs font-medium text-[#526f78]">{todayStr}</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#28363b]">
            {greeting}, {displayName}
          </h1>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 z-10 self-start md:self-center">
          <button
            onClick={() => router.push("/admin/notifications/broadcast")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e3e1dc] bg-secondary text-xs font-semibold text-[#202b30] hover:bg-secondary/70 transition-all shadow-2xs cursor-pointer"
          >
            <Megaphone size={14} className="text-[#c98260]" />
            <span>New Announcement</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e3e1dc] bg-card text-xs font-semibold text-[#202b30] hover:bg-secondary transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-[#c98260]" : "text-[#526f78]"} />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassStatCard
          icon={<GraduationCap size={20} />}
          label="Students"
          value={stats?.studentCount ?? 0}
          accentColor="mineral"
        />
        <GlassStatCard
          icon={<Users size={20} />}
          label="Faculty"
          value={stats?.teacherCount ?? 0}
          accentColor="carbon"
        />
        <GlassStatCard
          icon={<BookOpen size={20} />}
          label="Classes"
          value={stats?.classCount ?? 0}
          accentColor="copper"
        />
        <GlassStatCard
          icon={<ShieldCheck size={20} />}
          label="Attendance Rate"
          value={stats?.biometricPassRate !== undefined && (stats.attendanceCount ?? 0) > 0 ? `${stats.biometricPassRate}%` : "0.0%"}
          accentColor="emerald"
        />
      </div>

      {/* Administration Controls Hub */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#526f78] uppercase tracking-wider">
            Quick Actions
          </h2>
        </div>
        <AdminQuickActions />
      </div>
    </div>
  );
}
