"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Users, Grid, Download } from "lucide-react";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import toast from "react-hot-toast";
import type { AcademicClassWithGeofence, ClassStatsResponse } from "@/types";

import AnalyticsOverviewTab from "@/components/teacher/AnalyticsOverviewTab";
import StudentsRosterTab from "@/components/teacher/StudentsRosterTab";
import AttendanceMatrixTable from "@/components/teacher/AttendanceMatrixTable";
import { exportClassSummaryCsv } from "@/components/teacher/analyticsExport";

type ActiveTab = "overview" | "students" | "matrix";

export default function AnalyticsPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get("classId") || "";

  const [classes, setClasses] = useState<AcademicClassWithGeofence[]>([]);
  const [selectedClass, setSelectedClass] = useState(initialClassId);
  const [stats, setStats] = useState<ClassStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  useEffect(() => {
    async function fetchClasses(): Promise<void> {
      try {
        const { data } = await api.get<AcademicClassWithGeofence[]>("/teacher/my-classes");
        setClasses(data);
        if (data.length > 0) setSelectedClass(data[0].id);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load classes"));
        setClasses([]);
      } finally {
        setLoading(false);
      }
    }
    void fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    async function fetchStats(): Promise<void> {
      setStatsLoading(true);
      try {
        const { data } = await api.get<ClassStatsResponse>(`/teacher/classes/${selectedClass}/stats`);
        setStats(data);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load class analytics"));
        setStats(null);
      } finally {
        setStatsLoading(false);
      }
    }
    void fetchStats();
  }, [selectedClass]);

  if (loading) return <GlassLoader text="Loading analytics..." />;
  if (classes.length === 0) {
    return (
      <div className="space-y-6">
        <GlassBreadcrumb items={[{ label: "Teacher", href: "/teacher/classes" }, { label: "Analytics" }]} />
        <GlassPageHeader title="Class Analytics" />
        <GlassEmptyState title="No Classes Assigned" message="You have no assigned academic classes yet." />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <GlassBreadcrumb items={[{ label: "Teacher", href: "/teacher/classes" }, { label: "Analytics" }]} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <GlassPageHeader
          title="Class Analytics"
          description="Track attendance trends, review student records, and identify students needing attention."
        />
        <div className="flex items-center gap-3">
          <div className="w-56 sm:w-64">
            <GlassSelect
              options={classes.map((c) => ({
                value: c.id,
                label: c.subject && !c.name.toLowerCase().includes(c.subject.toLowerCase().slice(0, 8))
                  ? `${c.name} • ${c.subject}`
                  : c.name,
              }))}
              value={selectedClass}
              onChange={setSelectedClass}
            />
          </div>
          <GlassButton
            variant="secondary"
            className="text-xs h-9 px-3 shrink-0"
            icon={<Download size={14} />}
            onClick={() => exportClassSummaryCsv(stats)}
            disabled={!stats || !stats.students || stats.students.length === 0}
          >
            Export CSV
          </GlassButton>
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-[#eeece7]/80 border border-[#e3e1dc]">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "overview"
              ? "bg-white text-[#28363b] shadow-2xs border border-[#e3e1dc]"
              : "text-[#526f78] hover:text-[#28363b] hover:bg-white/50"
          }`}
        >
          <BarChart3 size={15} /> Overview
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "students"
              ? "bg-white text-[#28363b] shadow-2xs border border-[#e3e1dc]"
              : "text-[#526f78] hover:text-[#28363b] hover:bg-white/50"
          }`}
        >
          <Users size={15} /> Student Attendance
          {stats?.at_risk_count ? (
            <span
              title={`${stats.at_risk_count} students with attendance under 75%`}
              className="px-1.5 py-0.2 rounded text-[10px] bg-[#b54242]/15 text-[#b54242] border border-[#b54242]/30 font-bold"
            >
              {stats.at_risk_count}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "matrix"
              ? "bg-white text-[#28363b] shadow-2xs border border-[#e3e1dc]"
              : "text-[#526f78] hover:text-[#28363b] hover:bg-white/50"
          }`}
        >
          <Grid size={15} /> Attendance Sheet
        </button>
      </div>

      {statsLoading ? (
        <div className="py-16">
          <GlassLoader text="Loading class statistics..." />
        </div>
      ) : stats ? (
        <>
          {activeTab === "overview" && <AnalyticsOverviewTab stats={stats} />}
          {activeTab === "students" && (
            <StudentsRosterTab
              students={stats.students ?? []}
              totalSessions={stats.total_sessions}
              onSelectStudent={(id) =>
                router.push(`/teacher/classes/${selectedClass}/students/${id}`)
              }
            />
          )}
          {activeTab === "matrix" && (
            <AttendanceMatrixTable
              classId={selectedClass}
              onSelectStudent={(id) =>
                router.push(`/teacher/classes/${selectedClass}/students/${id}`)
              }
            />
          )}
        </>
      ) : (
        <div className="p-8 rounded-2xl bg-card border border-[#e3e1dc]">
          <GlassEmptyState title="No Statistics Available" message="No attendance data is available for this class." />
        </div>
      )}
    </div>
  );
}
