"use client";

import React, { useEffect, useState, useCallback } from "react";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassLoader from "@/components/ui/GlassLoader";
import toast from "react-hot-toast";
import TeacherDashboardHeader from "./TeacherDashboardHeader";
import TeacherActiveSessionHero from "./TeacherActiveSessionHero";
import TeacherMetricStrip from "./TeacherMetricStrip";
import TeacherClassesCard from "./TeacherClassesCard";
import TeacherRecentSessionsCard from "./TeacherRecentSessionsCard";
import TeacherPendingQueueCard from "./TeacherPendingQueueCard";
import TeacherQuickActions from "@/components/teacher/TeacherQuickActions";
import type {
  AcademicClassWithGeofence,
  SessionWithClassResponse,
  FlaggedAttendanceResponse,
  PendingLeaveItem,
} from "@/types";

export default function TeacherDashboardPage(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<AcademicClassWithGeofence[]>([]);
  const [sessions, setSessions] = useState<SessionWithClassResponse[]>([]);
  const [flagged, setFlagged] = useState<FlaggedAttendanceResponse[]>([]);
  const [leaves, setLeaves] = useState<PendingLeaveItem[]>([]);

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const [classRes, sessionRes, flagRes, leaveRes] = await Promise.allSettled([
        api.get<AcademicClassWithGeofence[]>("/teacher/my-classes"),
        api.get<SessionWithClassResponse[]>("/teacher/sessions/all"),
        api.get<FlaggedAttendanceResponse[]>("/teacher/attendance/flagged"),
        api.get<PendingLeaveItem[]>("/teacher/leaves/pending"),
      ]);

      if (classRes.status === "fulfilled") setClasses(classRes.value.data);
      if (sessionRes.status === "fulfilled") setSessions(sessionRes.value.data);
      if (flagRes.status === "fulfilled") setFlagged(flagRes.value.data);
      if (leaveRes.status === "fulfilled") setLeaves(leaveRes.value.data);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to refresh dashboard data"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  if (loading) return <GlassLoader />;

  const activeSessions = sessions.filter((s) => s.isActive);
  const currentLiveSession = activeSessions.length > 0 ? activeSessions[0] : null;

  return (
    <div className="space-y-6">
      <TeacherDashboardHeader
        todayStr={todayStr}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      <TeacherActiveSessionHero session={currentLiveSession} />

      <TeacherMetricStrip
        classCount={classes.length}
        activeSessionCount={activeSessions.length}
        flaggedCount={flagged.length}
        pendingLeaveCount={leaves.length}
      />

      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Quick Actions
        </h2>
        <TeacherQuickActions />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <TeacherClassesCard classes={classes} />
          <TeacherRecentSessionsCard sessions={sessions} />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <TeacherPendingQueueCard flagged={flagged} leaves={leaves} />
        </div>
      </div>
    </div>
  );
}
