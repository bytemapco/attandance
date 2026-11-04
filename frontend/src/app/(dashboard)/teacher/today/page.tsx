"use client";

import React from "react";
import PageHeader from "@/components/ui/PageHeader";
import WeekTimetable from "./WeekTimetable";

export default function TeacherTodayPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <PageHeader title="Timetable" description="Your classes for the week." />
      <WeekTimetable />
    </div>
  );
}
