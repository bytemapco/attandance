"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import useSWR from "swr";
import api, { getApiErrorMessage } from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import type { ClassSessionStartResult, TeacherClassItem } from "@/types";
import DashboardClassCard from "./DashboardClassCard";

const NO_CLASSES: TeacherClassItem[] = [];

interface MyClassesProps {
  refreshKey: number;
}

export default function MyClasses({ refreshKey }: MyClassesProps): React.ReactElement {
  const router = useRouter();
  const { data, error, isLoading: loading, mutate } = useSWR<TeacherClassItem[]>("/faculty/classes");
  const items = data ?? NO_CLASSES;
  const failed = Boolean(error) && !data;
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, "Could not load your classes"));
  }, [error]);

  // The page asks for a fresh list whenever something it started changes `refreshKey`.
  useEffect(() => {
    if (refreshKey) void mutate();
  }, [refreshKey, mutate]);

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

  if (loading) return <PageSkeleton />;
  if (failed) return <ErrorState message="Your classes could not be loaded." onRetry={() => void mutate()} />;
  if (items.length === 0) {
    return (
      <EmptyState
        title="No classes assigned yet"
        message="Your administrator assigns you to a class and subject. They will appear here."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <DashboardClassCard
          key={item.course_section_id}
          item={item}
          starting={startingId === item.course_section_id}
          onStart={() => void start(item)}
          onOpen={(occurrenceId) => router.push(`/teacher/attendance/${occurrenceId}`)}
        />
      ))}
    </div>
  );
}
