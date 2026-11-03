"use client";

import React, { useMemo, useState } from "react";
import StudentTable from "./StudentTable";
import type { ClassAnalytics } from "@/types";

export default function ClassDetail({ item }: { item: ClassAnalytics }): React.ReactElement {
  const [query, setQuery] = useState("");
  const [onlyBelow, setOnlyBelow] = useState(false);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return item.students.filter((s) => {
      if (onlyBelow && (s.percentage ?? 100) >= item.threshold) return false;
      return !needle || `${s.student_name} ${s.enrollment_number}`.toLowerCase().includes(needle);
    });
  }, [item, query, onlyBelow]);

  const emptyMessage =
    item.sessions_held === 0 ? "No lecture has been submitted yet, so there is nothing to measure." : "No students match.";

  return (
    <section className="overflow-hidden rounded-[14px] border border-border bg-card" aria-label={`${item.class_code} ${item.subject_name}`}>
      <header className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-foreground">{item.class_code} · {item.subject_name}</h2>
          <p className="text-xs text-muted-foreground">Lowest attendance first. Required: {item.threshold}%.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or roll no."
            aria-label="Search students"
            className="h-9 w-52 rounded-[10px] border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#526f78]"
          />
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={onlyBelow} onChange={(e) => setOnlyBelow(e.target.checked)} className="size-4 accent-[#526f78]" />
            Shortage only (below {item.threshold}%)
          </label>
        </div>
      </header>
      <StudentTable rows={rows} threshold={item.threshold} emptyMessage={emptyMessage} />
    </section>
  );
}
