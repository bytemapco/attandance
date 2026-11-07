"use client";

import React from "react";
import { BookOpen, Clock, Lock, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { TeacherClassItem } from "@/types";

interface DashboardClassCardProps {
  item: TeacherClassItem;
  /** When the class meets today. Empty when the list is not limited to today. */
  times?: string;
  starting: boolean;
  onStart: () => void;
  onOpen: (occurrenceId: string) => void;
}

function closesAt(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export default function DashboardClassCard({ item, times, starting, onStart, onOpen }: DashboardClassCardProps): React.ReactElement {
  const liveId = item.live_occurrence_id;
  const meta = [item.class_code, item.semester ? `Sem ${item.semester}` : null, item.department_name]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card padding="md" className="flex h-full flex-col justify-between bg-card">
      <div>
        <div className="mb-3 flex items-start justify-between">
          <div className="rounded-lg bg-secondary p-2 text-primary">
            <BookOpen size={18} />
          </div>
          {liveId && <Badge variant="success">Live</Badge>}
        </div>
        <h3 className="text-base font-semibold tracking-tight text-foreground">{item.subject_name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
        <dl className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          {times && (
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Clock size={13} /> {times}
            </div>
          )}
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
      <Button
        className="mt-4 w-full text-xs"
        variant={liveId ? "secondary" : "primary"}
        size="sm"
        loading={starting}
        disabled={!liveId && item.student_count === 0}
        onClick={liveId ? () => onOpen(liveId) : onStart}
      >
        {liveId ? "Continue attendance" : "Take attendance"}
      </Button>
      {!liveId && item.closed_occurrence_id && (
        <Button
          className="mt-2 w-full text-xs"
          variant="ghost"
          size="sm"
          onClick={() => onOpen(item.closed_occurrence_id as string)}
        >
          View today&apos;s register
        </Button>
      )}
    </Card>
  );
}
