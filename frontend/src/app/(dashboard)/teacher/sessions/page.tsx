"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassLoader from "@/components/ui/GlassLoader";
import StartSessionCard from "./StartSessionCard";
import ActiveSessionsCard from "./ActiveSessionsCard";
import PastSessionsTable from "./PastSessionsTable";
import SmartPassGeneratorModal from "@/components/scanner/SmartPassGeneratorModal";
import type { AcademicClassWithGeofence, SessionResponse, SessionWithClassResponse } from "@/types";

export default function SessionsPage(): React.ReactElement {
  const router = useRouter();
  const [classes, setClasses] = useState<AcademicClassWithGeofence[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [duration, setDuration] = useState("10");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [activeSessions, setActiveSessions] = useState<SessionWithClassResponse[]>([]);
  const [pastSessions, setPastSessions] = useState<SessionWithClassResponse[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [selectedQrSession, setSelectedQrSession] = useState<{ id: string; className: string } | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const [classesRes, allSessionsRes] = await Promise.all([
        api.get<AcademicClassWithGeofence[]>("/teacher/my-classes"),
        api.get<SessionWithClassResponse[]>("/teacher/sessions/all"),
      ]);
      setClasses(classesRes.data);

      const now = new Date();
      setActiveSessions(
        allSessionsRes.data.filter((s) => s.isActive && new Date(s.endTime) > now)
      );
      setPastSessions(
        allSessionsRes.data.filter((s) => !s.isActive || new Date(s.endTime) <= now)
      );
    } catch {
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchData();
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const classId = params.get("classId");
        if (classId) {
          setClassFilter(classId);
          setSelectedClass(classId);
        }
      }
    })();
  }, [fetchData]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hasExpired = activeSessions.some((s) => new Date(s.endTime) <= now);
      if (hasExpired) {
        void fetchData();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSessions, fetchData]);

  const handleClearFilter = useCallback((): void => {
    setClassFilter("");
    router.replace("/teacher/sessions");
  }, [router]);

  async function handleStart(): Promise<void> {
    if (!selectedClass) { toast.error("Select a class first"); return; }
    const mins = parseInt(duration, 10);
    if (isNaN(mins) || mins < 1 || mins > 180) { toast.error("Duration must be 1–180 minutes"); return; }
    setStarting(true);
    try {
      const { data } = await api.post<SessionResponse>("/teacher/sessions/start", {
        academic_class_id: selectedClass,
        duration_minutes: mins,
      });
      const cls = classes.find((c) => c.id === selectedClass);
      const newSession: SessionWithClassResponse = {
        ...data,
        class_name: cls?.name ?? "Class Session",
        subject: cls?.subject ?? "",
      };
      setActiveSessions((prev) => [...prev, newSession]);
      toast.success("Session started!");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to start session"));
    } finally {
      setStarting(false);
    }
  }

  async function handleStop(sessionId: string): Promise<void> {
    try {
      await api.post(`/teacher/sessions/${sessionId}/stop`);
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Session stopped");
      await fetchData();
    } catch {
      toast.error("Failed to stop session");
    }
  }

  if (loading) return <GlassLoader />;

  const filteredActiveSessions = classFilter
    ? activeSessions.filter((s) => s.academicClassId === classFilter)
    : activeSessions;

  const filteredPastSessions = classFilter
    ? pastSessions.filter((s) => s.academicClassId === classFilter)
    : pastSessions;

  const filteredClass = classes.find((c) => c.id === classFilter);
  const filterLabel = filteredClass ? `${filteredClass.name} — ${filteredClass.subject}` : "Selected Class";

  return (
    <div className="animate-fade-in space-y-6">
      <GlassBreadcrumb items={[{ label: "Teacher", href: "/teacher/classes" }, { label: "Sessions" }]} />
      <GlassPageHeader title="Class Sessions" />

      {classFilter && (
        <div className="p-4 flex items-center justify-between animate-fade-in text-sm border border-[#e3e1dc] bg-card rounded-2xl">
          <div className="flex items-center gap-2 text-[#28363b]">
            Showing class: <span className="font-semibold">{filterLabel}</span>
          </div>
          <button 
            onClick={handleClearFilter}
            className="text-xs text-[#526f78] hover:text-[#28363b] hover:underline transition-colors font-medium"
          >
            Clear Filter
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StartSessionCard
          classes={classes}
          selectedClass={selectedClass}
          duration={duration}
          starting={starting}
          onClassChange={setSelectedClass}
          onDurationChange={setDuration}
          onStart={() => void handleStart()}
        />

        <ActiveSessionsCard
          sessions={filteredActiveSessions}
          onStop={(id) => void handleStop(id)}
          onOpenQr={(session) => {
            const hasSubjectInName = session.subject &&
              session.class_name.toLowerCase().includes(session.subject.toLowerCase().slice(0, 8));
            const displayName = session.class_name
              ? (session.subject && !hasSubjectInName
                  ? `${session.class_name} • ${session.subject}`
                  : session.class_name)
              : "Class Session";
            setSelectedQrSession({
              id: session.id,
              className: displayName,
            });
          }}
        />
      </div>

      <PastSessionsTable sessions={filteredPastSessions} />

      {selectedQrSession && (
        <SmartPassGeneratorModal
          isOpen={true}
          onClose={() => setSelectedQrSession(null)}
          sessionId={selectedQrSession.id}
          className={selectedQrSession.className}
          onStudentVerified={() => {
            void fetchData();
          }}
        />
      )}
    </div>
  );
}
