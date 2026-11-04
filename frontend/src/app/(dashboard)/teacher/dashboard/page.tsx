"use client";

import React, { useState } from "react";
import TeacherDashboardHeader from "./TeacherDashboardHeader";
import MyClasses from "./MyClasses";

export default function TeacherDashboardPage(): React.ReactElement {
  const [refreshKey, setRefreshKey] = useState(0);

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6">
      <TeacherDashboardHeader todayStr={todayStr} onRefresh={() => setRefreshKey((key) => key + 1)} />
      <div className="space-y-2.5">
        <h2 className="text-xs font-semibold text-foreground">Your classes</h2>
        <MyClasses refreshKey={refreshKey} />
      </div>
    </div>
  );
}
