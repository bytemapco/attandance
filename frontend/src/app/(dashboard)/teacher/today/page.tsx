"use client";

import React from "react";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import TodayClasses from "./TodayClasses";

export default function TeacherTodayPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <GlassPageHeader
        title="Today's Classes"
        description="Classes your administrator scheduled for you today. Start attendance when the class begins."
      />
      <TodayClasses />
    </div>
  );
}
