"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import GlassErrorState from "@/components/ui/GlassErrorState";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import type { HistoryItem } from "@/types";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

export default function AttendanceHistoryPage(): React.ReactElement {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<HistoryItem[]>("/faculty/history");
      setItems(data);
      setError(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Could not load attendance history"));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const classes = useMemo(() => {
    const seen = new Map<string, string>();
    (items ?? []).forEach((i) => seen.set(i.course_section_id, `${i.subject_name} · ${i.class_code}`));
    return [...seen.entries()];
  }, [items]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (items ?? []).filter(
      (i) =>
        (!sectionId || i.course_section_id === sectionId) &&
        (!needle || `${i.subject_name} ${i.class_code}`.toLowerCase().includes(needle))
    );
  }, [items, sectionId, query]);

  if (error) return <GlassErrorState message={error} onRetry={() => void load()} />;
  if (!items) return <GlassLoader />;

  return (
    <div className="space-y-5">
      <GlassPageHeader title="Attendance history" description="Every session you have taken. Open one to see or review its register." />
      {items.length === 0 ? (
        <GlassEmptyState title="No sessions yet" message="Sessions you start from My Classes will be listed here." />
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
            <label className="sm:w-72">
              <span className="sr-only">Class</span>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="h-9 w-full rounded-[10px] border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#526f78]"
              >
                <option value="">All classes</option>
                {classes.map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </label>
            <label className="sm:w-72">
              <span className="sr-only">Search</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search class or subject"
                className="h-9 w-full rounded-[10px] border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#526f78]"
              />
            </label>
          </div>
          {rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">No sessions match.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5 font-semibold">Class</th>
                  <th className="px-4 py-2.5 font-semibold">Period</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Present</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((i) => (
                  <tr key={i.occurrence_id}>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(i.date)}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-foreground">{i.subject_name}</span>
                      <span className="block text-xs text-muted-foreground">{i.class_code}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">{i.time_range}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{i.present} / {i.total}</td>
                    <td className="px-4 py-3">
                      {i.locked ? <GlassBadge variant="info">Closed</GlassBadge> : <GlassBadge variant="success">Live</GlassBadge>}
                      {i.flagged > 0 && <GlassBadge variant="warning" className="ml-1.5">{i.flagged} flagged</GlassBadge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/teacher/attendance/${i.occurrence_id}`} className="text-xs font-semibold text-[#526f78] underline-offset-2 hover:underline">
                        Open register
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
