"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import type { ClassSessionStartResult, TeacherClassItem } from "@/types";
import DashboardClassCard from "./DashboardClassCard";

interface MyClassesProps {
  refreshKey: number;
}

export default function MyClasses({ refreshKey }: MyClassesProps): React.ReactElement {
  const router = useRouter();
  const [items, setItems] = useState<TeacherClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<TeacherClassItem[]>("/faculty/classes");
      setItems(data);
      setFailed(false);
    } catch (err: unknown) {
      setFailed(true);
      toast.error(getApiErrorMessage(err, "Could not load your classes"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

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
  if (failed) return <ErrorState message="Your classes could not be loaded." onRetry={() => void load()} />;
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
