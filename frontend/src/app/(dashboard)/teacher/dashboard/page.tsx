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
      <MyClasses refreshKey={refreshKey} />
    </div>
  );
}
