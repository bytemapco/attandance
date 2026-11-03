"use client";

import React from "react";
import { AlertTriangle, Check, Clock, Plane, X } from "lucide-react";
import GlassBadge, { type BadgeVariant } from "@/components/ui/GlassBadge";
import type { RegisterStudentItem } from "@/types";
import { initials, markedBy, type DisplayStatus, type MarkStatus } from "./registerStatus";

interface StudentTileProps {
  student: RegisterStudentItem;
  status: DisplayStatus;
  active: boolean;
  unsaved: boolean;
  disabled: boolean;
  onActivate: () => void;
  onMark: (status: MarkStatus) => void;
}

const BADGE: Record<DisplayStatus, { variant: BadgeVariant; label: string; icon: React.ReactNode }> = {
  PRESENT: { variant: "success", label: "Present", icon: <Check size={11} /> },
  ABSENT: { variant: "danger", label: "Absent", icon: <X size={11} /> },
  WAITING: { variant: "neutral", label: "Waiting", icon: <Clock size={11} /> },
  FLAGGED: { variant: "warning", label: "To verify", icon: <AlertTriangle size={11} /> },
  EXCUSED: { variant: "info", label: "On leave", icon: <Plane size={11} /> },
};

function MarkButton({ target, current, disabled, onClick }: { target: MarkStatus; current: DisplayStatus; disabled: boolean; onClick: () => void }): React.ReactElement {
  const present = target === "PRESENT";
  const on = current === target;
  const onClass = present ? "border-[#247653] bg-[#247653] text-white" : "border-[#b54242] bg-[#b54242] text-white";
  const offClass = present ? "text-[#247653] hover:bg-[#e8f3ed]" : "text-[#b54242] hover:bg-[#f9eaea]";
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={present ? "Mark present" : "Mark absent"}
      title={present ? "Present (P)" : "Absent (A)"}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#526f78] disabled:cursor-not-allowed disabled:opacity-50 ${
        on ? onClass : `border-border bg-card ${offClass}`
      }`}
    >
      {present ? <Check size={16} /> : <X size={16} />}
    </button>
  );
}

export default function StudentTile({ student, status, active, unsaved, disabled, onActivate, onMark }: StudentTileProps): React.ReactElement {
  const badge = BADGE[status];
  const by = markedBy(student);
  return (
    <li
      id={`tile-${student.student_id}`}
      aria-current={active ? "true" : undefined}
      onClick={onActivate}
      className={`flex cursor-pointer items-center gap-3 rounded-[10px] border bg-card px-3 py-2.5 transition-colors duration-150 ${
        active ? "border-[#526f78] ring-2 ring-[#526f78]/25" : "border-border hover:border-[#d4d0c8]"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-[#28363b]" aria-hidden>
        {initials(student.student_name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{student.student_name}</p>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{student.enrollment_number}</p>
        {status === "FLAGGED" && (
          <p className="mt-1 text-xs text-[#8a5b12]" title={student.remarks ?? undefined}>
            {student.remarks ?? "Needs your review"}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 sm:w-36 sm:items-start">
        <GlassBadge variant={badge.variant} icon={badge.icon} className="px-2 py-0 text-[11px]">
          {badge.label}
        </GlassBadge>
        <p className="text-xs text-muted-foreground">
          {unsaved ? <span className="font-semibold text-[#8a5b12]">Unsaved</span> : by && status !== "EXCUSED" ? `via ${by}` : null}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <MarkButton target="PRESENT" current={status} disabled={disabled} onClick={() => onMark("PRESENT")} />
        <MarkButton target="ABSENT" current={status} disabled={disabled} onClick={() => onMark("ABSENT")} />
      </div>
    </li>
  );
}
