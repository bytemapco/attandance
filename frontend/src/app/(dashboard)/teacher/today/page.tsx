"use client";

import React from "react";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import WeekTimetable from "./WeekTimetable";

export default function TeacherTodayPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <GlassPageHeader title="Timetable" description="Your classes for the week." />
      <WeekTimetable />
    </div>
  );
}
