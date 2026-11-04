"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { RegisterStudentItem } from "@/types";
import {
  displayStatus, type Counts, type Edits, type MarkStatus, type RegisterFilter,
} from "./registerStatus";
import StudentTile from "./StudentTile";
import { useGridKeys } from "./useGridKeys";

interface RegisterGridProps {
  students: RegisterStudentItem[];
  edits: Edits;
  counts: Counts;
  locked: boolean;
  editable: boolean;
  shortcutsEnabled: boolean;
  onMark: (studentId: string, status: MarkStatus | null) => void;
}

const FILTERS: { key: RegisterFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "PRESENT", label: "Present" },
  { key: "WAITING", label: "Waiting" },
  { key: "FLAGGED", label: "To verify" },
  { key: "ABSENT", label: "Absent" },
  { key: "EXCUSED", label: "On leave" },
];

export default function RegisterGrid({ students, edits, counts, locked, editable, shortcutsEnabled, onMark }: RegisterGridProps): React.ReactElement {
  const [filter, setFilter] = useState<RegisterFilter>("ALL");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return students
      .map((student) => ({ student, status: displayStatus(student, edits, locked) }))
      .filter(
        ({ student, status }) =>
          (filter === "ALL" || status === filter) &&
          (!needle || student.student_name.toLowerCase().includes(needle) || student.enrollment_number.toLowerCase().includes(needle))
      );
  }, [students, edits, locked, filter, query]);

  const ids = useMemo(() => rows.map((r) => r.student.student_id), [rows]);
  const currentId = activeId && ids.includes(activeId) ? activeId : (ids[0] ?? null);

  useEffect(() => {
    if (currentId) document.getElementById(`tile-${currentId}`)?.scrollIntoView({ block: "nearest" });
  }, [currentId]);

  const visibleFilters = FILTERS.filter(({ key }) => key === "ALL" || counts[key] > 0 || key === filter);

  useGridKeys({
    enabled: shortcutsEnabled,
    canMark: editable,
    ids,
    activeId: currentId,
    statusOf: (id) => rows.find((r) => r.student.student_id === id)?.status ?? "WAITING",
    columns: () => gridRef.current ? getComputedStyle(gridRef.current).gridTemplateColumns.split(" ").length : 1,
    onActive: setActiveId,
    onMark,
    onFilter: (index) => setFilter(visibleFilters[index]?.key ?? filter),
    onSearch: () => searchRef.current?.focus(),
  });

  return (
    <section className="flex min-h-[360px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[0_2px_8px_rgba(40,54,59,0.05)] lg:min-h-0">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter students">
          {visibleFilters.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring ${
                filter === key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-border"
              }`}
            >
              {label}
              <span className="tabular-nums opacity-70">{counts[key]}</span>
            </button>
          ))}
        </div>
        <label className="relative block sm:w-60">
          <span className="sr-only">Search students</span>
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setQuery("");
                e.currentTarget.blur();
              }
              if (e.key === "Enter" || e.key === "ArrowDown") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            placeholder="Search name or enrollment"
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm border border-border px-1.5 text-[11px] text-muted-foreground">/</kbd>
        </label>
      </div>
      <div className="max-h-[70dvh] flex-1 overflow-y-auto p-4 lg:max-h-none">
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {students.length === 0 ? "No students are enrolled in this class yet." : "No students match."}
          </p>
        ) : (
          <ul ref={gridRef} className="flex flex-col gap-2">
            {rows.map(({ student, status }) => (
              <StudentTile
                key={student.student_id}
                student={student}
                status={status}
                active={student.student_id === currentId}
                unsaved={student.student_id in edits}
                disabled={!editable}
                onActivate={() => setActiveId(student.student_id)}
                onMark={(next) => onMark(student.student_id, next)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
