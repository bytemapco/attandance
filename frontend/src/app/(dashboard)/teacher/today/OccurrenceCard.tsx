"use client";

import React from "react";
import { BookOpen, Clock, DoorOpen, Users } from "lucide-react";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import type { DailyOccurrenceItem } from "@/types";
import { occurrenceState, STATE_BADGE, STATE_LABEL } from "../attendance/occurrenceState";

interface OccurrenceCardProps {
  item: DailyOccurrenceItem;
  starting: boolean;
  onStart: () => void;
  onOpen: () => void;
}

const ACTION_LABEL = { NOT_STARTED: "Start attendance", LIVE: "Open live class", COMPLETED: "View attendance" };

export default function OccurrenceCard({ item, starting, onStart, onOpen }: OccurrenceCardProps): React.ReactElement {
  const state = occurrenceState(item);
  const cancelled = state === "CANCELLED";
  return (
    <GlassCard padding="md" className="flex h-full flex-col justify-between bg-card">
      <div>
        <div className="mb-3 flex items-start justify-between">
          <div className="rounded-lg bg-secondary p-2 text-primary">
            <BookOpen size={18} />
          </div>
          <GlassBadge variant={STATE_BADGE[state]}>{STATE_LABEL[state]}</GlassBadge>
        </div>
        <h3 className="text-base font-bold tracking-tight text-foreground">{item.course_name}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {item.class_code} · {item.subject_code}
        </p>
        <dl className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock size={13} /> {item.start_time}–{item.end_time}
          </div>
          <div className="flex items-center gap-2">
            <DoorOpen size={13} /> {item.classroom_name}
          </div>
          <div className="flex items-center gap-2">
            <Users size={13} /> {item.present_count}/{item.total_enrolled} present
          </div>
        </dl>
      </div>
      {!cancelled && (
        <GlassButton
          className="mt-4 w-full text-xs"
          variant={state === "NOT_STARTED" ? "primary" : "secondary"}
          size="sm"
          loading={starting}
          onClick={state === "NOT_STARTED" ? onStart : onOpen}
        >
          {ACTION_LABEL[state]}
        </GlassButton>
      )}
    </GlassCard>
  );
}
