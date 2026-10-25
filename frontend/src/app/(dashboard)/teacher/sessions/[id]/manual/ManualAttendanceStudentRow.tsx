"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualAttendanceStudentRowProps {
  student: {
    student_id: string;
    enrollment_number: string;
    full_name: string;
  };
  isPresent: boolean;
  isFocused: boolean;
  onClick: () => void;
  innerRef: (el: HTMLDivElement | null) => void;
}

export default function ManualAttendanceStudentRow({
  student,
  isPresent,
  isFocused,
  onClick,
  innerRef,
}: ManualAttendanceStudentRowProps): React.ReactElement {
  return (
    <div
      ref={innerRef}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-3 cursor-pointer select-none transition-colors border-l-4",
        isPresent
          ? "bg-emerald-50/40 border-l-emerald-600 hover:bg-emerald-50/70"
          : "bg-red-50/30 border-l-red-500 hover:bg-red-50/60",
        isFocused && "ring-2 ring-primary/20 bg-secondary/50"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-mono text-xs font-semibold text-foreground bg-secondary px-2 py-0.5 rounded border border-border">
          {student.enrollment_number}
        </span>
        <span className="font-medium text-foreground text-sm truncate">
          {student.full_name || (student as { student_name?: string }).student_name || "Unknown Student"}
        </span>
      </div>

      <div>
        {isPresent ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Check size={11} strokeWidth={3} />
            Present
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <X size={11} strokeWidth={3} />
            Absent
          </span>
        )}
      </div>
    </div>
  );
}
