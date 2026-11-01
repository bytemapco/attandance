"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CalendarRange, Clock } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassLoader from "@/components/ui/GlassLoader";
import AcademicYearsTab from "@/components/admin/academicCalendar/AcademicYearsTab";
import TimeSlotsTab from "@/components/admin/academicCalendar/TimeSlotsTab";
import type { AcademicYearResponse, TimeSlotResponse } from "@/types";

type TabKey = "years" | "timeslots";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "years", label: "Academic Years", icon: <CalendarRange size={14} /> },
  { key: "timeslots", label: "Time Slots", icon: <Clock size={14} /> },
];

export default function AcademicCalendarPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabKey>("years");
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState<AcademicYearResponse[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const [yearsRes, slotsRes] = await Promise.all([
        api.get<AcademicYearResponse[]>("/admin/academic-years"),
        api.get<TimeSlotResponse[]>("/admin/timeslots"),
      ]);
      setYears(yearsRes.data);
      setTimeSlots(slotsRes.data);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Failed to load academic calendar");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  if (loading) return <GlassLoader />;

  return (
    <div className="animate-fade-in-up space-y-4">
      <GlassPageHeader title="Academic Calendar" description="Academic years, semesters and the daily period timings." />

      <div className="flex items-center gap-2 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === tab.key
                ? "bg-secondary text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "years" && <AcademicYearsTab years={years} error={error} onRefresh={fetchAll} />}
      {activeTab === "timeslots" && <TimeSlotsTab slots={timeSlots} error={error} onRefresh={fetchAll} />}
    </div>
  );
}
