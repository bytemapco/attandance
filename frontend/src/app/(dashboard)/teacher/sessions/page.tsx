"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Radio, Play } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassCard from "@/components/ui/GlassCard";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
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
  const [activeSessions, setActiveSessions] = useState<SessionResponse[]>([]);
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
        allSessionsRes.data
          .filter((s) => s.isActive && new Date(s.endTime) > now)
          .map(({ id, academicClassId, startTime, endTime, isActive }) => ({
            id, academicClassId, startTime, endTime, isActive,
          }))
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
      setActiveSessions((prev) => [...prev, data]);
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
    <div className="animate-fade-in-up space-y-6">
      <GlassBreadcrumb items={[{ label: "Teacher", href: "/teacher/classes" }, { label: "Sessions" }]} />
      <GlassPageHeader title="Class Sessions" />

      {classFilter && (
        <div className="p-4 flex items-center justify-between animate-fade-in text-sm border border-border bg-card rounded-xl">
          <div className="flex items-center gap-2 text-foreground">
            Showing class: <span className="font-semibold">{filterLabel}</span>
          </div>
          <button 
            onClick={handleClearFilter}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors font-medium"
          >
            Clear Filter
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Radio size={20} />
            </div>
            <h3 className="text-base font-semibold text-foreground">Start New Session</h3>
          </div>
          <div className="space-y-4">
            <GlassSelect
              label="Class"
              options={classes.map((c) => ({ value: c.id, label: `${c.name} — ${c.subject}` }))}
              value={selectedClass}
              onChange={setSelectedClass}
              placeholder="Select class..."
            />
            <GlassInput
              label="Duration (minutes)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
            <GlassButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => void handleStart()}
              loading={starting}
              icon={<Play size={18} />}
            >
              Start Session
            </GlassButton>
          </div>
        </GlassCard>

        <ActiveSessionsCard
          sessions={filteredActiveSessions}
          onStop={(id) => void handleStop(id)}
          onOpenQr={(session) => {
            const cls = classes.find((c) => c.id === session.academicClassId);
            setSelectedQrSession({
              id: session.id,
              className: cls ? `${cls.name} — ${cls.subject}` : "Class Session",
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
