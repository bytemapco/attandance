"use client";

import React from "react";
import type { StudentResponse } from "@/types";

interface StudentSelectionListProps {
  students: StudentResponse[];
  selected: Set<string>;
  onToggle: (studentId: string) => void;
  onToggleAll: () => void;
}

function displayName(student: StudentResponse): string {
  return `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || student.email;
}

export default function StudentSelectionList({
  students,
  selected,
  onToggle,
  onToggleAll,
}: StudentSelectionListProps): React.ReactElement {
  const allSelected = students.length > 0 && students.every((s) => selected.has(s.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground sm:text-sm">
          Students in this batch ({selected.size} of {students.length} selected)
        </p>
        <button type="button" onClick={onToggleAll} className="text-xs font-semibold text-info hover:underline">
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>
      <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
        {students.map((s) => (
          <li key={s.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-secondary">
              <input type="checkbox" checked={selected.has(s.id)} onChange={() => onToggle(s.id)} />
              <span className="font-medium">{displayName(s)}</span>
              <span className="text-xs text-muted-foreground">{s.enrollment_number}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
