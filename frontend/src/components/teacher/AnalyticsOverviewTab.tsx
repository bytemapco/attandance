"use client";

import React from "react";
import { BookOpen, Users, TrendingUp, AlertOctagon, BarChart3, PieChart, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassStatCard from "@/components/ui/GlassStatCard";
import type { ClassStatsResponse } from "@/types";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface AnalyticsOverviewTabProps {
  stats: ClassStatsResponse;
}

export default function AnalyticsOverviewTab({ stats }: AnalyticsOverviewTabProps): React.ReactElement {
  const trendData = stats.history && stats.history.length > 0
    ? stats.history.map((h) => ({
        session: h.session_name,
        attendance: h.attendance_percentage,
      }))
    : Array.from({ length: 5 }, (_, i) => ({
        session: `S${i + 1}`,
        attendance: 0,
      }));

  const tiersData = [
    { tier: "< 50%", count: stats.distribution_tiers?.below_50 ?? 0, fill: "#f43f5e" },
    { tier: "50-75%", count: stats.distribution_tiers?.between_50_75 ?? 0, fill: "#f59e0b" },
    { tier: "75-85%", count: stats.distribution_tiers?.between_75_85 ?? 0, fill: "#3b82f6" },
    { tier: "> 85%", count: stats.distribution_tiers?.above_85 ?? 0, fill: "#10b981" },
  ];

  return (
    <div className="space-y-6">
      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassStatCard
          icon={<TrendingUp size={20} />}
          label="Avg Attendance"
          value={`${(stats.overall_attendance_percentage ?? 0).toFixed(1)}%`}
          accentColor="emerald"
        />
        <GlassStatCard
          icon={<Users size={20} />}
          label="Enrolled Students"
          value={stats.total_students}
          accentColor="sky"
        />
        <GlassStatCard
          icon={<BookOpen size={20} />}
          label="Total Sessions"
          value={stats.total_sessions}
          accentColor="emerald"
        />
        <GlassStatCard
          icon={<AlertOctagon size={20} />}
          label="At-Risk Defaulters (<75%)"
          value={stats.at_risk_count ?? 0}
          accentColor={stats.at_risk_count ? "rose" : "emerald"}
        />
      </div>

      {/* Status Breakdown Bar */}
      {stats.status_distribution && (
        <div className="p-4 rounded-xl border border-border bg-card/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">Present Check-ins</span>
              <strong className="text-sm font-bold text-foreground">{stats.status_distribution.present}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <XCircle size={16} />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">Recorded Absences</span>
              <strong className="text-sm font-bold text-foreground">{stats.status_distribution.absent}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <AlertTriangle size={16} />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">Flagged Reviews</span>
              <strong className="text-sm font-bold text-foreground">{stats.status_distribution.flagged}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">Excused / Approved</span>
              <strong className="text-sm font-bold text-foreground">{stats.status_distribution.approved}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="bg-card">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-emerald-500" /> Attendance Trend Over Time
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
              <XAxis dataKey="session" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: 8, fontSize: 12, color: "#fff" }} />
              <Area type="monotone" dataKey="attendance" stroke="#10b981" fill="url(#attendanceGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="bg-card">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <PieChart size={16} className="text-sky-500" /> Performance Tier Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tiersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
              <XAxis dataKey="tier" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: 8, fontSize: 12, color: "#fff" }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}
