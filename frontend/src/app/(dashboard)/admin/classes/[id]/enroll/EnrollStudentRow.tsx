"use client";

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import GlassBadge from "@/components/ui/GlassBadge";
import { cn } from "@/lib/utils";
import type { StudentResponse } from "@/types";

interface EnrollStudentRowProps {
  student: StudentResponse;
  isSelected: boolean;
  isAlreadyEnrolled: boolean;
  onToggle: () => void;
}

export default function EnrollStudentRow({
  student,
  isSelected,
  isAlreadyEnrolled,
  onToggle,
}: EnrollStudentRowProps): React.ReactElement {
  const fullName = student.first_name || student.last_name
    ? `${student.first_name || ""} ${student.last_name || ""}`.trim()
    : "Unknown Student";

  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3.5 p-3 rounded-lg border transition-colors",
        isAlreadyEnrolled
          ? "bg-muted/40 border-border opacity-50 cursor-not-allowed"
          : isSelected
          ? "bg-secondary border-primary/30 cursor-pointer shadow-xs"
          : "bg-card border-border hover:bg-secondary/50 cursor-pointer"
      )}
    >
      <div className={cn(
        "shrink-0",
        isAlreadyEnrolled
          ? "text-emerald-600"
          : isSelected
          ? "text-primary"
          : "text-muted-foreground/50"
      )}>
        {isAlreadyEnrolled || isSelected ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
        <div className="sm:col-span-4 min-w-0">
          <p className="font-semibold text-foreground truncate">{fullName}</p>
          <p className="text-[11px] text-muted-foreground truncate">{student.email}</p>
        </div>

        <div className="sm:col-span-3">
          <p className="font-mono text-foreground font-medium">{student.enrollment_number || "—"}</p>
          <p className="text-[10px] text-muted-foreground">Enrollment #</p>
        </div>

        <div className="sm:col-span-3 flex items-center gap-1.5 flex-wrap">
          {student.department_name && (
            <GlassBadge variant="neutral" className="text-[11px]">{student.department_name}</GlassBadge>
          )}
          {isAlreadyEnrolled && (
            <GlassBadge variant="success" className="text-[10px] font-bold">Enrolled</GlassBadge>
          )}
        </div>

        <div className="sm:col-span-2 text-right hidden sm:block">
          <span className="text-[10px] text-muted-foreground font-mono">
            {student.id.substring(0, 8)}...
          </span>
        </div>
      </div>
    </div>
  );
}
