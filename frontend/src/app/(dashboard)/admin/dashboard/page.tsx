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
import GlassButton from "@/components/ui/GlassButton";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
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
      <GlassPageHeader
        title={`${greeting}, ${displayName}`}
        description={todayStr}
        className="mb-0"
        actions={
          <>
            <GlassButton
              variant="secondary"
              icon={<Megaphone size={14} />}
              onClick={() => router.push("/admin/notifications/broadcast")}
            >
              New announcement
            </GlassButton>
            <GlassButton
              variant="secondary"
              icon={<RefreshCw size={14} />}
              loading={refreshing}
              onClick={handleRefresh}
            >
              Refresh
            </GlassButton>
          </>
        }
      />

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
            interactive
          />
        </Link>
        <Link href="/admin/users/teachers" aria-label="View faculty" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-muted-foreground">
          <GlassStatCard
            icon={<Users size={20} />}
            label="Faculty"
            value={stats?.teacherCount ?? "—"}
            subtext="View faculty records"
            accentColor="carbon"
            interactive
          />
        </Link>
        <Link href="/admin/class-management" aria-label="View classes" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-muted-foreground">
          <GlassStatCard
            icon={<BookOpen size={20} />}
            label="Classes"
            value={stats?.classCount ?? "—"}
            subtext="View classes and schedules"
            accentColor="copper"
            interactive
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
