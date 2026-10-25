"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassTable from "@/components/ui/GlassTable";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import toast from "react-hot-toast";
import HistoryFilters from "./HistoryFilters";
import { getSessionLogColumns, type SessionLogItem } from "./HistoryColumns";

interface AcademicClass {
  id: string;
  name: string;
  subject: string;
}

export default function HistoryPage(): React.ReactElement {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionLogItem[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedClass, setSelectedClass] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExportCSV = async (
    sessionId: string,
    className: string,
    subjectName: string,
    startTime: string
  ): Promise<void> => {
    setExportingId(sessionId);
    try {
      const { data } = await api.get<{ roster: { enrollment_number: string; full_name: string; email: string; status: string; final_score: number; marked_at: string | null }[] }>(
        `/teacher/sessions/${sessionId}/attendance`
      );
      
      if (!data.roster || data.roster.length === 0) {
        toast.error("No student records found to export.");
        return;
      }

      const headers = ["Enrollment Number", "Student Name", "Email", "Status", "AI Score", "Marked At"];
      const rows = data.roster.map((s) => [
        s.enrollment_number,
        s.full_name,
        s.email,
        s.status,
        s.final_score.toFixed(2),
        s.marked_at ? new Date(s.marked_at).toLocaleString() : "N/A"
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const sanitizedClass = className.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const dateStr = new Date(startTime).toISOString().slice(0, 10);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `attendance_${sanitizedClass}_${dateStr}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV exported successfully!");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to export CSV"));
    } finally {
      setExportingId(null);
    }
  };

  useEffect(() => {
    async function initPage(): Promise<void> {
      try {
        const [sessionsRes, classesRes] = await Promise.all([
          api.get<SessionLogItem[]>("/teacher/sessions/all"),
          api.get<AcademicClass[]>("/teacher/my-classes")
        ]);
        setSessions(sessionsRes.data);
        setClasses(classesRes.data);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load history"));
      } finally {
        setLoading(false);
      }
    }
    void initPage();
  }, []);

  function handleResetFilters(): void {
    setSelectedClass("all");
    setSearchTerm("");
    setDateFilter("");
  }

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (selectedClass !== "all" && session.academicClassId !== selectedClass) {
        return false;
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = session.class_name.toLowerCase().includes(term);
        const matchesSubject = session.subject.toLowerCase().includes(term);
        const matchesId = session.id.toLowerCase().includes(term);
        if (!matchesName && !matchesSubject && !matchesId) return false;
      }

      if (dateFilter) {
        const sessionDate = new Date(session.startTime).toDateString();
        const filterDate = new Date(dateFilter).toDateString();
        if (sessionDate !== filterDate) return false;
      }

      return true;
    });
  }, [sessions, selectedClass, searchTerm, dateFilter]);

  const columns = useMemo(() => getSessionLogColumns({
    onPreview: (id) => router.push(`/teacher/sessions/${id}/preview`),
    onRoster: (id) => router.push(`/teacher/sessions/${id}/roster`),
    onManual: (id) => router.push(`/teacher/sessions/${id}/manual`),
    onExport: (id, className, subject, startTime) => void handleExportCSV(id, className, subject, startTime),
    exportingId,
  }), [router, exportingId]);

  if (loading) return <GlassLoader />;

  return (
    <div className="animate-fade-in-up">
      <GlassPageHeader
        title="Attendance History"
      />

      <HistoryFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        classes={classes}
        onReset={handleResetFilters}
      />

      {filteredSessions.length > 0 ? (
        <GlassTable
          columns={columns}
          data={filteredSessions as (SessionLogItem & Record<string, unknown>)[]}
          emptyMessage="No matching sessions found for current filters"
          pageSize={10}
        />
      ) : (
        <div className="p-8 text-center rounded-2xl bg-card border border-border">
          <GlassEmptyState
            title="No Sessions Match Filters"
            message="Try loosening your search terms or selecting a different class dropdown option."
          />
          {(selectedClass !== "all" || searchTerm || dateFilter) && (
            <button
              onClick={handleResetFilters}
              className="glass-btn glass-btn-primary mt-4 text-xs px-4 py-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
