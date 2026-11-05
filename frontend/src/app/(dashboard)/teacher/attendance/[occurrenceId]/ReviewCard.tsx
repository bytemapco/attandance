"use client";

import React from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import Button from "@/components/ui/Button";
import type { RegisterStudentItem } from "@/types";
import { evidenceLine, initials } from "./registerStatus";
import type { FlagDecision } from "./useFlaggedReview";

interface ReviewCardProps {
  student: RegisterStudentItem;
  /** The decision being saved for this card, if any. */
  saving: FlagDecision | null;
  disabled: boolean;
  onDecide: (decision: FlagDecision) => void;
}

export default function ReviewCard({ student, saving, disabled, onDecide }: ReviewCardProps): React.ReactElement {
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-warning-border bg-warning-soft/40 p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card text-xs font-semibold text-primary" aria-hidden>
          {initials(student.student_name)}
        </span>
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-semibold text-foreground">
            {student.student_name}{" "}
            <span className="font-mono text-xs font-normal text-muted-foreground">{student.enrollment_number}</span>
          </p>
          <p className="flex items-start gap-1.5 text-xs text-warning">
            <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden />
            {student.remarks ?? "Needs your review"}
          </p>
          <p className="text-xs text-muted-foreground">{evidenceLine(student)}</p>
          {student.student_note && (
            <blockquote className="border-l-2 border-border-strong pl-2 text-xs text-foreground">
              &ldquo;{student.student_note}&rdquo; <span className="text-muted-foreground">Student&apos;s note</span>
            </blockquote>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Check size={14} />}
          loading={saving === "APPROVE"}
          disabled={disabled}
          aria-label={`Approve ${student.student_name}`}
          onClick={() => onDecide("APPROVE")}
        >
          Approve
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={<X size={14} />}
          loading={saving === "REJECT"}
          disabled={disabled}
          aria-label={`Mark ${student.student_name} absent`}
          onClick={() => onDecide("REJECT")}
        >
          Mark absent
        </Button>
      </div>
    </li>
  );
}
