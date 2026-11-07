"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import useSWR from "swr";
import api, { getApiErrorMessage } from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { todayIso } from "@/lib/teacher/weekDates";
import { todaysClasses, type TodaysClass } from "@/lib/teacher/todaysClasses";
import type { ClassSessionStartResult, DailyOccurrenceItem, TeacherClassItem } from "@/types";
import ClassScopeToggle, { type ClassScope } from "./ClassScopeToggle";
import DashboardClassCard from "./DashboardClassCard";

const NO_CLASSES: TeacherClassItem[] = [];
const NO_LESSONS: DailyOccurrenceItem[] = [];

interface MyClassesProps {
  refreshKey: number;
}

export default function MyClasses({ refreshKey }: MyClassesProps): React.ReactElement {
  const router = useRouter();
  const [scope, setScope] = useState<ClassScope>("today");
  const today = todayIso();
  const { data, error, isLoading: loadingClasses, mutate } = useSWR<TeacherClassItem[]>("/faculty/classes");
  const {
    data: lessons, error: lessonsError, isLoading: loadingLessons, mutate: mutateLessons,
  } = useSWR<DailyOccurrenceItem[]>(scope === "today" ? ["/faculty/daily-schedule", { target_date: today, end_date: today }] : null);
  const items = data ?? NO_CLASSES;
  const [startingId, setStartingId] = useState<string | null>(null);
  const loading = loadingClasses || (scope === "today" && loadingLessons);
  const failed = (Boolean(error) && !data) || (scope === "today" && Boolean(lessonsError) && !lessons);

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, "Could not load your classes"));
  }, [error]);

  // The page asks for a fresh list whenever something it started changes `refreshKey`.
  useEffect(() => {
    if (!refreshKey) return;
    void mutate();
    void mutateLessons();
  }, [refreshKey, mutate, mutateLessons]);

  async function start(item: TeacherClassItem): Promise<void> {
    setStartingId(item.course_section_id);
    try {
      const { data } = await api.post<ClassSessionStartResult>(`/faculty/classes/${item.course_section_id}/start`);
      router.push(`/teacher/attendance/${data.occurrence_id}`);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not start attendance for this lecture"));
      setStartingId(null);
    }
  }

  const visible: TodaysClass[] =
    scope === "today" ? todaysClasses(items, lessons ?? NO_LESSONS) : items.map((item) => ({ item, times: "" }));

  function retry(): void {
    void mutate();
    void mutateLessons();
  }

  function content(): React.ReactElement {
    if (loading) return <PageSkeleton />;
    if (failed) return <ErrorState message="Your classes could not be loaded." onRetry={retry} />;
    if (items.length === 0) {
      return (
        <EmptyState
          title="No classes assigned yet"
          message="Your administrator assigns you to a class and subject. They will appear here."
        />
      );
    }
    if (visible.length === 0) {
      return (
        <EmptyState
          title="No classes today"
          message="Nothing is scheduled for you today. Your other classes are under All classes."
          actionLabel="Show all classes"
          onAction={() => setScope("all")}
        />
      );
    }
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(({ item, times }) => (
          <DashboardClassCard
            key={item.course_section_id}
            item={item}
            times={times}
            starting={startingId === item.course_section_id}
            onStart={() => void start(item)}
            onOpen={(occurrenceId) => router.push(`/teacher/attendance/${occurrenceId}`)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ClassScopeToggle value={scope} onChange={setScope} />
      {content()}
    </div>
  );
}
