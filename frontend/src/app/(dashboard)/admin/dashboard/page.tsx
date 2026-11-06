"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Users, GraduationCap, BookOpen, ShieldCheck, RefreshCw, Megaphone 
} from "lucide-react";
import useSWR from "swr";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import PageSkeleton from "@/components/ui/PageSkeleton";
import AdminQuickActions from "@/components/admin/AdminQuickActions";
import SetupGate from "@/components/admin/onboarding/SetupGate";
import type { AdminStatsResponse } from "@/types";

export default function AdminDashboardPage(): React.ReactElement {
  const router = useRouter();
  const { data: stats, error, isLoading: loading, isValidating: refreshing, mutate } = useSWR<AdminStatsResponse>("/admin/stats");

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  useEffect(() => {
    if (error) toast.error("Failed to load dashboard metrics");
  }, [error]);

  const handleRefresh = async (): Promise<void> => {
    await mutate();
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Dashboard"
        description={todayStr}
        className="mb-0"
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Megaphone size={14} />}
              onClick={() => router.push("/admin/notifications/broadcast")}
            >
              New announcement
            </Button>
            <Button
              variant="secondary"
              icon={<RefreshCw size={14} />}
              loading={refreshing}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </>
        }
      />

      <SetupGate />

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/users/students" aria-label="View students" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-muted-foreground">
          <StatCard
            icon={<GraduationCap size={20} />}
            label="Students"
            value={stats?.studentCount ?? "—"}
            subtext="View student records"
            accentColor="mineral"
            interactive
          />
        </Link>
        <Link href="/admin/users/teachers" aria-label="View faculty" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-muted-foreground">
          <StatCard
            icon={<Users size={20} />}
            label="Faculty"
            value={stats?.teacherCount ?? "—"}
            subtext="View faculty records"
            accentColor="carbon"
            interactive
          />
        </Link>
        <Link href="/admin/class-management" aria-label="View classes" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-muted-foreground">
          <StatCard
            icon={<BookOpen size={20} />}
            label="Classes"
            value={stats?.classCount ?? "—"}
            subtext="View classes and schedules"
            accentColor="copper"
            interactive
          />
        </Link>
        <StatCard
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
