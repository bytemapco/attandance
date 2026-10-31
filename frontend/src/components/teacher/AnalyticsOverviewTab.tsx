"use client";

import React from "react";
import { BookOpen, Users, TrendingUp, AlertOctagon, BarChart3, PieChart, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassStatCard from "@/components/ui/GlassStatCard";
import type { ClassStatsResponse } from "@/types";
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
    { tier: "< 50%", count: stats.distribution_tiers?.below_50 ?? 0, fill: "#b54242" },
    { tier: "50–75%", count: stats.distribution_tiers?.between_50_75 ?? 0, fill: "#c98260" },
    { tier: "75–85%", count: stats.distribution_tiers?.between_75_85 ?? 0, fill: "#526f78" },
    { tier: "> 85%", count: stats.distribution_tiers?.above_85 ?? 0, fill: "#247653" },
  ];

  return (
    <div className="space-y-6">
      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassStatCard
          icon={<TrendingUp size={20} />}
          label="Average Attendance"
          value={`${(stats.overall_attendance_percentage ?? 0).toFixed(1)}%`}
          accentColor="emerald"
        />
        <GlassStatCard
          icon={<Users size={20} />}
          label="Enrolled Students"
          value={stats.total_students}
          accentColor="mineral"
        />
        <GlassStatCard
          icon={<BookOpen size={20} />}
          label="Total Sessions"
          value={stats.total_sessions}
          accentColor="copper"
        />
        <GlassStatCard
          icon={<AlertOctagon size={20} />}
          label="Needs Attention (<75%)"
          value={stats.at_risk_count ?? 0}
          accentColor={stats.at_risk_count ? "rose" : "emerald"}
        />
      </div>

      {/* Status Breakdown Bar */}
      {stats.status_distribution && (
        <div className="p-4 rounded-2xl border border-[#e3e1dc] bg-card shadow-[0_2px_8px_rgba(40,54,59,0.04)] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#e8f3ed]/60 border border-[#c6e2d3]/60">
            <div className="p-2 rounded-lg bg-[#247653]/15 text-[#247653] border border-[#247653]/30">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#526f78] block font-medium">Present</span>
              <strong className="text-base font-bold text-[#202b30] font-mono tabular-nums">{stats.status_distribution.present}</strong>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f9eaea]/60 border border-[#f0c9c9]/60">
            <div className="p-2 rounded-lg bg-[#b54242]/15 text-[#b54242] border border-[#b54242]/30">
              <XCircle size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#526f78] block font-medium">Absent</span>
              <strong className="text-base font-bold text-[#202b30] font-mono tabular-nums">{stats.status_distribution.absent}</strong>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#fbf1df]/60 border border-[#f2deba]/60">
            <div className="p-2 rounded-lg bg-[#8a5b12]/15 text-[#8a5b12] border border-[#8a5b12]/30">
              <AlertTriangle size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#526f78] block font-medium">Pending Review</span>
              <strong className="text-base font-bold text-[#202b30] font-mono tabular-nums">{stats.status_distribution.flagged}</strong>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#eaf2f6]/60 border border-[#c5dce8]/60">
            <div className="p-2 rounded-lg bg-[#306b8a]/15 text-[#306b8a] border border-[#306b8a]/30">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <span className="text-[11px] text-[#526f78] block font-medium">Excused</span>
              <strong className="text-base font-bold text-[#202b30] font-mono tabular-nums">{stats.status_distribution.approved}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#28363b] flex items-center gap-2">
              <BarChart3 size={16} className="text-[#247653]" /> Attendance Trend
            </h3>
            <span className="text-xs text-[#526f78]">Session-by-session</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#247653" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#247653" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e1dc" strokeOpacity={0.7} />
              <XAxis dataKey="session" stroke="#526f78" fontSize={11} tickLine={false} />
              <YAxis stroke="#526f78" fontSize={11} domain={[0, 100]} tickLine={false} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: "#28363b", borderColor: "#526f78", borderRadius: 10, fontSize: 12, color: "#f8fafc" }} />
              <Area type="monotone" dataKey="attendance" stroke="#247653" fill="url(#attendanceGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#28363b] flex items-center gap-2">
              <PieChart size={16} className="text-[#c98260]" /> Attendance Distribution
            </h3>
            <span className="text-xs text-[#526f78]">Student tiers</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tiersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e1dc" strokeOpacity={0.7} />
              <XAxis dataKey="tier" stroke="#526f78" fontSize={11} tickLine={false} />
              <YAxis stroke="#526f78" fontSize={11} allowDecimals={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#28363b", borderColor: "#526f78", borderRadius: 10, fontSize: 12, color: "#f8fafc" }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {tiersData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}
