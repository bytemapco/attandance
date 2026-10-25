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
import SystemEventsCard from "@/components/admin/SystemEventsCard";
import type { AdminStatsResponse, SystemHealthResponse, AuditLogResponse } from "@/types";

export default function AdminDashboardPage(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const displayName = user?.email ? user.email.split("@")[0] : "Administrator";

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const fetchDashboardData = useCallback(async (): Promise<void> => {
    try {
      const [statsRes, healthRes, auditRes] = await Promise.allSettled([
        api.get<AdminStatsResponse>("/admin/stats"),
        api.get<SystemHealthResponse>("/health"),
        api.get<AuditLogResponse[]>("/admin/audit", { params: { page_size: 10 } }),
      ]);

      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      else toast.error("Could not load latest institution statistics");

      if (healthRes.status === "fulfilled") setHealth(healthRes.value.data);
      if (auditRes.status === "fulfilled") {
        const raw = auditRes.value.data;
        const items = Array.isArray(raw) ? raw : (raw as { items?: AuditLogResponse[] })?.items || [];
        setAuditEvents(items);
      }
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

  const isHealthy = health?.status === "healthy";

  return (
    <div className="space-y-6 pb-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">{todayStr}</p>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isHealthy
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isHealthy ? "bg-emerald-500" : "bg-amber-500"}`} />
              {isHealthy ? "System Online" : "Degraded"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {greeting}, {displayName}
          </h1>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 z-10 self-start md:self-center">
          <button
            onClick={() => router.push("/admin/notifications/broadcast")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-secondary/50 text-xs font-semibold text-foreground hover:bg-secondary transition-all shadow-2xs cursor-pointer"
          >
            <Megaphone size={14} className="text-primary" />
            <span>Announcement</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-secondary transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin text-primary" : "text-muted-foreground"} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassStatCard
          icon={<GraduationCap size={20} />}
          label="Students"
          value={stats?.studentCount ?? 0}
          accentColor="blue"
        />
        <GlassStatCard
          icon={<Users size={20} />}
          label="Faculty"
          value={stats?.teacherCount ?? 0}
          accentColor="emerald"
        />
        <GlassStatCard
          icon={<BookOpen size={20} />}
          label="Classes"
          value={stats?.classCount ?? 0}
          accentColor="purple"
        />
        <GlassStatCard
          icon={<ShieldCheck size={20} />}
          label="Verification Rate"
          value={stats?.biometricPassRate !== undefined && (stats.attendanceCount ?? 0) > 0 ? `${stats.biometricPassRate}%` : "0.0%"}
          accentColor="amber"
        />
      </div>

      {/* Administration Controls Hub */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Quick Actions
          </h2>
        </div>
        <AdminQuickActions />
      </div>

      {/* Activity Stream */}
      <div>
        <SystemEventsCard events={auditEvents} />
      </div>
    </div>
  );
}
