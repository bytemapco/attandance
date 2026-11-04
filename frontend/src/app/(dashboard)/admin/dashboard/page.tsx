"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
import SetupGate from "@/components/admin/onboarding/SetupGate";
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
      setStats(null);
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
      <div className="relative overflow-hidden rounded-lg border border-border bg-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-1 z-10">
          <p className="text-xs font-medium text-muted-foreground">{todayStr}</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
            {greeting}, {displayName}
          </h1>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 z-10 self-start md:self-center">
          <button
            onClick={() => router.push("/admin/notifications/broadcast")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary text-xs font-semibold text-foreground hover:bg-secondary/70 transition-all cursor-pointer"
          >
            <Megaphone size={14} className="text-accent-strong" />
            <span>New Announcement</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-secondary transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-accent-strong" : "text-muted-foreground"} />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      <SetupGate />

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/users/students" aria-label="View students" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-muted-foreground">
          <GlassStatCard
            icon={<GraduationCap size={20} />}
            label="Students"
            value={stats?.studentCount ?? "—"}
            subtext="View student records"
            accentColor="mineral"
          />
        </Link>
        <Link href="/admin/users/teachers" aria-label="View faculty" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-muted-foreground">
          <GlassStatCard
            icon={<Users size={20} />}
            label="Faculty"
            value={stats?.teacherCount ?? "—"}
            subtext="View faculty records"
            accentColor="carbon"
          />
        </Link>
        <Link href="/admin/class-management" aria-label="View classes" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-muted-foreground">
          <GlassStatCard
            icon={<BookOpen size={20} />}
            label="Classes"
            value={stats?.classCount ?? "—"}
            subtext="View classes and schedules"
            accentColor="copper"
          />
        </Link>
        <GlassStatCard
          icon={<ShieldCheck size={20} />}
          label="Attendance Rate"
          value={stats && (stats.attendanceCount ?? 0) > 0 ? `${stats.attendanceRate ?? 0}%` : "—"}
          subtext={stats && (stats.attendanceCount ?? 0) > 0 ? "Present, late or approved" : stats ? "No attendance recorded yet" : "Unavailable"}
          accentColor="emerald"
        />
      </div>

      {/* Administration Controls Hub */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Quick actions
          </h2>
        </div>
        <AdminQuickActions />
      </div>
    </div>
  );
}
