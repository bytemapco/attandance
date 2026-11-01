"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import { classAction, classStatus, countByStatus } from "@/lib/teacher/classStatus";
import { buildTimetable } from "@/lib/teacher/timetableGrid";
import { isValidDay, shiftDays, todayIso, weekDays, weekStart } from "@/lib/teacher/weekDates";
import GlassErrorState from "@/components/ui/GlassErrorState";
import GlassLoader from "@/components/ui/GlassLoader";
import type { DailyOccurrenceItem } from "@/types";
import StatusSummary from "./StatusSummary";
import TimetableGrid from "./TimetableGrid";
import TimetableToolbar from "./TimetableToolbar";

/** The teacher's week: what is done, what is pending, and what is coming. */
export default function WeekTimetable(): React.ReactElement {
  const router = useRouter();
  const [selected, setSelected] = useState(() => todayIso());
  const [classes, setClasses] = useState<DailyOccurrenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const today = todayIso(new Date(now));
  const monday = weekStart(selected);
  const days = useMemo(() => weekDays(monday), [monday]);
  const first = days[0];
  const last = days[days.length - 1];

  const load = useCallback(async (quiet: boolean): Promise<void> => {
    if (!quiet) setLoading(true);
    try {
      const { data } = await api.get<DailyOccurrenceItem[]>("/faculty/daily-schedule", {
        params: { target_date: first, end_date: last },
      });
      setClasses(data);
      setNow(Date.now());
      setFailed(false);
    } catch (err: unknown) {
      if (!quiet) setFailed(true);
      toast.error(getApiErrorMessage(err, "Could not load your timetable"));
    } finally {
      setLoading(false);
    }
  }, [first, last]);

  useEffect(() => {
    void load(false);
  }, [load]);

  // Attendance is taken on another page, so refresh quietly when the teacher comes back to this tab.
  useEffect(() => {
    const refresh = (): void => {
      if (document.visibilityState === "visible") void load(true);
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [load]);

  // Keep the clock moving, so a live class turns done and a new day starts without a reload.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const grid = useMemo(() => buildTimetable(days, classes), [days, classes]);
  const counts = useMemo(() => countByStatus(classes, today, now), [classes, today, now]);

  async function activate(item: DailyOccurrenceItem): Promise<void> {
    const action = classAction(classStatus(item, today, now));
    if (action === "none") return;
    if (action === "start") {
      setOpeningId(item.id);
      try {
        await api.post(`/faculty/occurrences/${item.id}/start`);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Could not start attendance"));
        setOpeningId(null);
        return;
      }
    }
    router.push(`/teacher/attendance/${item.id}`);
  }

  function pick(day: string): void {
    if (isValidDay(day)) setSelected(day);
  }

  return (
    <div className="space-y-4">
      <TimetableToolbar
        monday={monday}
        selected={selected}
        onSelect={pick}
        onPreviousWeek={() => setSelected(shiftDays(selected, -7))}
        onNextWeek={() => setSelected(shiftDays(selected, 7))}
        onToday={() => setSelected(today)}
      />

      {loading && <GlassLoader />}
      {!loading && failed && <GlassErrorState message="Your timetable could not be loaded." onRetry={() => void load(false)} />}

      {!loading && !failed && classes.length === 0 && (
        <p className="rounded-xl border border-dashed border-[#d9d5cd] px-4 py-10 text-center text-sm text-[#526f78]">
          No classes this week.
        </p>
      )}

      {!loading && !failed && classes.length > 0 && (
        <>
          <StatusSummary counts={counts} />
          <TimetableGrid
            grid={grid}
            today={today}
            selected={selected}
            statusOf={(item) => classStatus(item, today, now)}
            openingId={openingId}
            onActivate={(item) => void activate(item)}
          />
        </>
      )}
    </div>
  );
}
