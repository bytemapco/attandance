"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import api, { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import GlassErrorState from "@/components/ui/GlassErrorState";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import ClassCard from "@/components/teacher/analytics/ClassCard";
import ClassDetail from "@/components/teacher/analytics/ClassDetail";
import StudentTable, { type StudentTableRow } from "@/components/teacher/analytics/StudentTable";
import type { ClassAnalytics } from "@/types";

type View = "classes" | "attention";

function Summary({ items }: { items: ClassAnalytics[] }): React.ReactElement {
  const scored = items.filter((i) => i.average_percentage !== null && i.average_percentage !== undefined);
  const average = scored.length
    ? Math.round((scored.reduce((sum, i) => sum + (i.average_percentage ?? 0), 0) / scored.length) * 10) / 10
    : null;
  const stats = [
    ["Classes", String(items.length)],
    ["Students", String(items.reduce((sum, i) => sum + i.student_count, 0))],
    ["Average attendance", average === null ? "—" : `${average}%`],
    ["In attendance shortage", String(items.reduce((sum, i) => sum + i.below_threshold.length, 0))],
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map(([label, value]) => (
        <div key={label} className="rounded-[14px] border border-border bg-card px-4 py-3">
          <dd className="text-2xl font-bold tabular-nums text-foreground">{value}</dd>
          <dt className="text-xs text-muted-foreground">{label}</dt>
        </div>
      ))}
    </dl>
  );
}

function ViewTabs({ view, onChange, attention }: { view: View; onChange: (v: View) => void; attention: number }): React.ReactElement {
  const tabs: [View, string][] = [["classes", "By class"], ["attention", `Shortage list (${attention})`]];
  return (
    <div role="tablist" className="inline-flex rounded-[10px] border border-border bg-card p-1">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={view === id}
          onClick={() => onChange(id)}
          className={cn(
            "rounded-[8px] px-3 py-1.5 text-sm font-semibold transition-colors",
            view === id ? "bg-[#526f78] text-white" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function ClassAnalyticsPage(): React.ReactElement {
  const [items, setItems] = useState<ClassAnalytics[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("classes");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const attentionRows = useMemo<StudentTableRow[]>(() => {
    const rows = (items ?? []).flatMap((i) => i.below_threshold.map((s) => ({ ...s, label: `${i.class_code} · ${i.subject_name}` })));
    return rows.sort((a, b) => (a.percentage ?? 0) - (b.percentage ?? 0));
  }, [items]);

  if (error) return <GlassErrorState message={error} onRetry={() => void load()} />;
  if (!items) return <GlassLoader />;

  const selected = items.find((i) => i.course_section_id === selectedId) ?? items.find((i) => i.below_threshold.length > 0) ?? items[0];
  const threshold = items[0]?.threshold ?? 0;

  return (
    <div className="space-y-5">
      <GlassPageHeader title="Attendance reports" description="Lecture-wise attendance for every class you teach, and students short of the required percentage." />
      {items.length === 0 ? (
        <GlassEmptyState title="No classes assigned yet" message="Analytics appear once your administrator assigns you to a class." />
      ) : (
        <>
          <Summary items={items} />
          <ViewTabs view={view} onChange={setView} attention={attentionRows.length} />
          {view === "classes" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <ClassCard
                    key={item.course_section_id}
                    item={item}
                    selected={item.course_section_id === selected.course_section_id}
                    onSelect={() => setSelectedId(item.course_section_id)}
                  />
                ))}
              </div>
              <ClassDetail key={selected.course_section_id} item={selected} />
            </>
          ) : (
            <div className="overflow-hidden rounded-[14px] border border-border bg-card">
              <StudentTable rows={attentionRows} threshold={threshold} showClass emptyMessage={`No attendance shortage. Every student is at or above ${threshold}%.`} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
