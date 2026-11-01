"use client";

import React, { useCallback, useEffect, useState } from "react";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import GlassErrorState from "@/components/ui/GlassErrorState";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import type { ClassAnalytics } from "@/types";

function percent(value?: number | null): string {
  return value === null || value === undefined ? "—" : `${value}%`;
}

function ClassPanel({ item }: { item: ClassAnalytics }): React.ReactElement {
  return (
    <section className="rounded-[14px] border border-border bg-card p-5 shadow-[0_2px_8px_rgba(40,54,59,0.05)]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{item.subject_name}</h2>
          <p className="text-xs text-muted-foreground">{item.class_code}</p>
        </div>
        <dl className="flex gap-6 text-right">
          {[
            ["Sessions held", String(item.sessions_held)],
            ["Students", String(item.student_count)],
            ["Average", percent(item.average_percentage)],
          ].map(([label, value]) => (
            <div key={label}>
              <dd className="text-2xl font-bold tabular-nums text-foreground">{value}</dd>
              <dt className="text-xs text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>
      </header>
      <h3 className="mt-5 text-sm font-semibold text-foreground">
        Below {item.threshold}% <span className="font-normal text-muted-foreground">({item.below_threshold.length})</span>
      </h3>
      {item.sessions_held === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No closed sessions yet, so there is nothing to measure.</p>
      ) : item.below_threshold.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Every student is at or above {item.threshold}%.</p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {item.below_threshold.map((s) => (
            <li key={s.student_id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">{s.student_name}</p>
                <p className="font-mono text-xs text-muted-foreground">{s.enrollment_number}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-muted-foreground">{s.attended} of {s.held} sessions</span>
                <GlassBadge variant="danger">{percent(s.percentage)}</GlassBadge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ClassAnalyticsPage(): React.ReactElement {
  const [items, setItems] = useState<ClassAnalytics[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<ClassAnalytics[]>("/faculty/analytics");
      setItems(data);
      setError(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not load class analytics"));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <GlassErrorState message={error} onRetry={() => void load()} />;
  if (!items) return <GlassLoader />;

  return (
    <div className="space-y-5">
      <GlassPageHeader title="Class analytics" description="Attendance across your closed sessions, and the students under your institution's minimum." />
      {items.length === 0 ? (
        <GlassEmptyState title="No classes assigned yet" message="Analytics appear once your administrator assigns you to a class." />
      ) : (
        <div className="space-y-5">{items.map((item) => <ClassPanel key={item.course_section_id} item={item} />)}</div>
      )}
    </div>
  );
}
