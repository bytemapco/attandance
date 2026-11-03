"use client";

import React from "react";
import { BookOpen, Clock, Lock, Users } from "lucide-react";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import type { TeacherClassItem } from "@/types";

interface ClassCardProps {
  item: TeacherClassItem;
  starting: boolean;
  onStart: () => void;
  onOpen: (occurrenceId: string) => void;
}

function closesAt(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export default function ClassCard({ item, starting, onStart, onOpen }: ClassCardProps): React.ReactElement {
  const liveId = item.live_occurrence_id;
  const meta = [item.class_code, item.semester ? `Sem ${item.semester}` : null, item.department_name]
    .filter(Boolean)
    .join(" · ");

  return (
    <GlassCard padding="md" className="flex h-full flex-col justify-between bg-card">
      <div>
        <div className="mb-3 flex items-start justify-between">
          <div className="rounded-lg bg-secondary p-2 text-primary">
            <BookOpen size={18} />
          </div>
          {liveId && <GlassBadge variant="success">Live</GlassBadge>}
        </div>
        <h3 className="text-base font-semibold tracking-tight text-foreground">{item.subject_name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
        <dl className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users size={13} /> {item.student_count} student{item.student_count === 1 ? "" : "s"}
          </div>
          {!liveId && item.closed_occurrence_id && (
            <div className="flex items-center gap-2">
              <Lock size={13} /> Attendance taken today
            </div>
          )}
          {liveId && item.window_closes_at && (
            <div className="flex items-center gap-2">
              <Clock size={13} /> Open until {closesAt(item.window_closes_at)}
            </div>
          )}
        </dl>
      </div>
      <GlassButton
        className="mt-4 w-full text-xs"
        variant={liveId ? "secondary" : "primary"}
        size="sm"
        loading={starting}
        disabled={!liveId && item.student_count === 0}
        onClick={liveId ? () => onOpen(liveId) : onStart}
      >
        {liveId ? "Continue attendance" : "Take attendance"}
      </GlassButton>
      {!liveId && item.closed_occurrence_id && (
        <GlassButton
          className="mt-2 w-full text-xs"
          variant="ghost"
          size="sm"
          onClick={() => onOpen(item.closed_occurrence_id as string)}
        >
          View today&apos;s register
        </GlassButton>
      )}
    </GlassCard>
  );
}
