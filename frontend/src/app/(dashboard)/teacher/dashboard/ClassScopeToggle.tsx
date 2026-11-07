"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type ClassScope = "today" | "all";

const OPTIONS: { value: ClassScope; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "all", label: "All classes" },
];

interface ClassScopeToggleProps {
  value: ClassScope;
  onChange: (scope: ClassScope) => void;
}

export default function ClassScopeToggle({ value, onChange }: ClassScopeToggleProps): React.ReactElement {
  return (
    <div role="group" aria-label="Which classes to show" className="inline-flex rounded-lg border border-border bg-card p-0.5">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-8 cursor-pointer rounded-md px-3 text-xs font-medium transition-colors",
            value === option.value ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
