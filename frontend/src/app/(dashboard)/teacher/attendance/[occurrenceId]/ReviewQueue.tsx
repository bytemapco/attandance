"use client";

import React, { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import type { RegisterStudentItem } from "@/types";
import ReviewCard from "./ReviewCard";
import type { FlagDecision } from "./useFlaggedReview";

interface ReviewQueueProps {
  /** Flagged marks the teacher can decide on, in register order. */
  items: RegisterStudentItem[];
  deciding: { student: RegisterStudentItem; decision: FlagDecision } | null;
  onDecide: (student: RegisterStudentItem, decision: FlagDecision) => void;
}

function useAnnounceNewFlags(items: RegisterStudentItem[]): void {
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    const known = seen.current;
    seen.current = new Set(items.map((item) => item.student_id));
    if (!known) return;
    const fresh = items.filter((item) => !known.has(item.student_id));
    if (fresh.length === 0) return;
    toast(fresh.length === 1 ? `${fresh[0].student_name}'s mark needs your review` : `${fresh.length} marks need your review`, {
      icon: <AlertTriangle size={16} className="text-warning" aria-hidden />,
    });
  }, [items]);
}

/** Scrolls to the review section and moves keyboard focus there. */
export function showReviewQueue(): void {
  const section = document.getElementById("review-queue");
  section?.scrollIntoView({ behavior: "smooth", block: "start" });
  section?.focus({ preventScroll: true });
}

/** Flagged marks, shown above the register so the teacher can decide without leaving the page. Empty when there are none. */
export default function ReviewQueue({ items, deciding, onDecide }: ReviewQueueProps): React.ReactElement | null {
  useAnnounceNewFlags(items);
  if (items.length === 0) return null;

  return (
    <section id="review-queue" tabIndex={-1} aria-labelledby="review-queue-title" className="shrink-0 rounded-lg border border-warning-border bg-card outline-none">
      <h2 id="review-queue-title" aria-live="polite" className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
        <AlertTriangle size={15} className="text-warning" aria-hidden />
        Needs your review
        <span className="tabular-nums text-muted-foreground">{items.length}</span>
      </h2>
      <ul className="flex max-h-[40dvh] flex-col gap-2 overflow-y-auto p-3">
        {items.map((student) => (
          <ReviewCard
            key={student.student_id}
            student={student}
            saving={deciding?.student.student_id === student.student_id ? deciding.decision : null}
            disabled={deciding !== null}
            onDecide={(decision) => onDecide(student, decision)}
          />
        ))}
      </ul>
    </section>
  );
}
