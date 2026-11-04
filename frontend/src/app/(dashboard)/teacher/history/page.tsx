"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import api, { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import GlassErrorState from "@/components/ui/GlassErrorState";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import SessionRow from "@/components/teacher/history/SessionRow";
import type { HistoryItem } from "@/types";

const PAGE_SIZE = 30;
type StatusFilter = "all" | "open" | "review";

const STATUS_OPTIONS: [StatusFilter, string][] = [
  ["all", "All"],
  ["open", "In progress"],
  ["review", "To verify"],
];

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function dayLabel(key: string): string {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  const toKey = (d: Date): string => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
  const long = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(key));
  if (key === toKey(today)) return `Today · ${long}`;
  if (key === toKey(yesterday)) return `Yesterday · ${long}`;
  return long;
}

function matches(item: HistoryItem, sectionId: string, status: StatusFilter): boolean {
  if (sectionId && item.course_section_id !== sectionId) return false;
  if (status === "open") return !item.locked;
  if (status === "review") return item.flagged > 0;
  return true;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }): React.ReactElement {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
        active ? "border-muted-foreground bg-muted-foreground text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export default function AttendanceHistoryPage(): React.ReactElement {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [shown, setShown] = useState(PAGE_SIZE);

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
    (items ?? []).forEach((i) => seen.set(i.course_section_id, `${i.class_code} · ${i.subject_name}`));
    return [...seen.entries()];
  }, [items]);

  const filtered = useMemo(() => (items ?? []).filter((i) => matches(i, sectionId, status)), [items, sectionId, status]);

  const groups = useMemo(() => {
    const byDay = new Map<string, HistoryItem[]>();
    filtered.slice(0, shown).forEach((i) => byDay.set(dayKey(i.date), [...(byDay.get(dayKey(i.date)) ?? []), i]));
    return [...byDay.entries()];
  }, [filtered, shown]);

  const pick = (apply: () => void): void => {
    apply();
    setShown(PAGE_SIZE);
  };

  if (error) return <GlassErrorState message={error} onRetry={() => void load()} />;
  if (!items) return <GlassLoader />;

  return (
    <div className="space-y-5">
      <GlassPageHeader title="Attendance history" description="Every lecture you have taken, newest first. Open one to see or correct its attendance register." />
      {items.length === 0 ? (
        <GlassEmptyState title="No lectures taken yet" message="Lectures you take attendance for from My Classes will be listed here." />
      ) : (
        <>
          <div className="space-y-3">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by class">
              <Chip active={!sectionId} onClick={() => pick(() => setSectionId(""))}>All classes</Chip>
              {classes.map(([id, label]) => (
                <Chip key={id} active={sectionId === id} onClick={() => pick(() => setSectionId(id))}>{label}</Chip>
              ))}
            </div>
            <div className="flex items-center gap-2" role="group" aria-label="Filter by status">
              {STATUS_OPTIONS.map(([id, label]) => (
                <Chip key={id} active={status === id} onClick={() => pick(() => setStatus(id))}>{label}</Chip>
              ))}
              <span className="ml-auto text-xs text-muted-foreground">{filtered.length} lectures</span>
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">Nothing matches these filters.</p>
          ) : (
            <div className="space-y-4">
              {groups.map(([key, day]) => (
                <section key={key} aria-label={dayLabel(key)}>
                  <h2 className="mb-1.5 px-1 text-xs font-semibold text-muted-foreground">{dayLabel(key)}</h2>
                  <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                    {day.map((i) => <SessionRow key={i.occurrence_id} item={i} />)}
                  </ul>
                </section>
              ))}
              {filtered.length > shown && (
                <button
                  type="button"
                  onClick={() => setShown((n) => n + PAGE_SIZE)}
                  className="mx-auto block rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary/60"
                >
                  Show more ({filtered.length - shown} left)
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
