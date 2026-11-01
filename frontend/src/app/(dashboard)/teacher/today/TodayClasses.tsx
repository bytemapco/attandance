"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassButton from "@/components/ui/GlassButton";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import GlassErrorState from "@/components/ui/GlassErrorState";
import GlassLoader from "@/components/ui/GlassLoader";
import type { DailyOccurrenceItem } from "@/types";
import OccurrenceCard from "./OccurrenceCard";

interface TodayClassesProps {
  onLoaded?: (items: DailyOccurrenceItem[]) => void;
}

export default function TodayClasses({ onLoaded }: TodayClassesProps): React.ReactElement {
  const router = useRouter();
  const [items, setItems] = useState<DailyOccurrenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<DailyOccurrenceItem[]>("/faculty/daily-schedule");
      setItems(data);
      setFailed(false);
      onLoaded?.(data);
    } catch (err: unknown) {
      setFailed(true);
      toast.error(getApiErrorMessage(err, "Could not load today's classes"));
    } finally {
      setLoading(false);
    }
  }, [onLoaded]);

  useEffect(() => {
    void load();
  }, [load]);

  async function start(item: DailyOccurrenceItem): Promise<void> {
    setStartingId(item.id);
    try {
      await api.post(`/faculty/occurrences/${item.id}/start`);
      router.push(`/teacher/attendance/${item.id}`);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not start attendance"));
      setStartingId(null);
    }
  }

  if (loading) return <GlassLoader />;
  if (failed) return <GlassErrorState message="Today's classes could not be loaded." onRetry={() => void load()} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <GlassButton variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={() => void load()}>
          Refresh
        </GlassButton>
      </div>
      {items.length === 0 ? (
        <GlassEmptyState
          title="No classes today"
          message="Nothing is scheduled for you today. Ask your administrator to schedule your subjects."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <OccurrenceCard
              key={item.id}
              item={item}
              starting={startingId === item.id}
              onStart={() => void start(item)}
              onOpen={() => router.push(`/teacher/attendance/${item.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
