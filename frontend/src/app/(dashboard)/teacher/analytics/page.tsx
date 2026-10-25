"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, Users, Grid, Download } from "lucide-react";



import api, { getApiErrorMessage } from "@/lib/api";
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
import StudentHistoryModal from "@/components/teacher/StudentHistoryModal";

type ActiveTab = "overview" | "students" | "matrix";

export default function AnalyticsPage(): React.ReactElement {
  const [classes, setClasses] = useState<AcademicClassWithGeofence[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [stats, setStats] = useState<ClassStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Student Drilldown Modal state
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    enrollment: string;
  } | null>(null);

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

  const handleExportSummaryCSV = (): void => {
    if (!stats || !stats.students || stats.students.length === 0) {
      toast.error("No student data to export.");
      return;
    }

    const headers = ["Enrollment Number", "Student Name", "Email", "Attended Sessions", "Total Sessions", "Attendance Rate %", "At-Risk Defaulter"];
    const rows = stats.students.map((s) => [
      s.enrollment_number,
      s.full_name,
      s.email,
      s.attended_sessions,
      s.total_sessions,
      `${s.attendance_percentage.toFixed(1)}%`,
      s.at_risk ? "YES" : "NO",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitizedName = (stats.class_name || "class").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_summary_${sanitizedName}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Class attendance report downloaded!");
  };

  if (loading) return <GlassLoader text="Loading analytics environment..." />;
  if (classes.length === 0) {
    return (
      <>
        <GlassPageHeader title="Analytics" />
        <GlassEmptyState title="No Classes Assigned" message="You have no assigned academic classes yet." />
      </>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Top Header with Class Picker & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <GlassPageHeader
          title="Attendance & Student Analytics"
          description="Enterprise grade attendance metrics, student history drilldowns, and defaulter tracking"
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-56">
            <GlassSelect
              label="Select Class"
              options={classes.map((c) => ({ value: c.id, label: `${c.name} (${c.subject})` }))}
              value={selectedClass}
              onChange={setSelectedClass}
            />
          </div>
          <GlassButton
            variant="secondary"
            className="text-xs h-10 px-3 self-end"
            icon={<Download size={14} />}
            onClick={handleExportSummaryCSV}
            disabled={!stats || !stats.students || stats.students.length === 0}
          >
            Export Class CSV
          </GlassButton>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "overview"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <BarChart3 size={15} /> Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "students"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <Users size={15} /> Student Defaulters & Roster
          {stats?.at_risk_count ? (
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {stats.at_risk_count}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "matrix"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <Grid size={15} /> Attendance Matrix Grid
        </button>
      </div>

      {/* Main Content Area */}
      {statsLoading ? (
        <div className="py-16"><GlassLoader text="Calculating class statistics and student summaries..." /></div>
      ) : stats ? (
        <>
          {activeTab === "overview" && <AnalyticsOverviewTab stats={stats} />}
          {activeTab === "students" && (
            <StudentsRosterTab
              students={stats.students ?? []}
              totalSessions={stats.total_sessions}
              onSelectStudent={(id, name, enrollment) =>
                setSelectedStudent({ id, name, enrollment })
              }
            />
          )}
          {activeTab === "matrix" && (
            <AttendanceMatrixTable
              classId={selectedClass}
              onSelectStudent={(id, name, enrollment) =>
                setSelectedStudent({ id, name, enrollment })
              }
            />
          )}
        </>
      ) : (
        <div className="p-8 rounded-2xl bg-card border border-border">
          <GlassEmptyState title="No Statistics Available" message="No attendance data is available for this class." />
        </div>
      )}

      {/* Student History Drilldown Modal */}
      {selectedStudent && (
        <StudentHistoryModal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          classId={selectedClass}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          enrollmentNumber={selectedStudent.enrollment}
        />
      )}
    </div>
  );
}
