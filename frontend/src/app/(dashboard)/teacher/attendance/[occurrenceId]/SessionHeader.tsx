"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCheck, Clock, DoorOpen, Lock, Pencil, Save } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { OccurrenceRegisterData } from "@/types";
import { STATE_BADGE, STATE_LABEL, type OccurrenceState } from "../occurrenceState";

interface SessionHeaderProps {
  register: OccurrenceRegisterData;
  state: OccurrenceState;
  changedCount: number;
  waitingCount: number;
  saving: boolean;
  correcting: boolean;
  onMarkRemaining: () => void;
  onSave: () => void;
  onStop: () => void;
  onCorrect: () => void;
  onCancelCorrection: () => void;
}

function Kbd({ children }: { children: React.ReactNode }): React.ReactElement {
  return <kbd aria-hidden className="ml-1 hidden rounded-sm border border-current/25 px-1 text-xs font-medium opacity-70 xl:inline">{children}</kbd>;
}

export default function SessionHeader({
  register, state, changedCount, waitingCount, saving, correcting, onMarkRemaining, onSave, onStop, onCorrect, onCancelCorrection,
}: SessionHeaderProps): React.ReactElement {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 space-y-1.5">
        <Link href="/teacher/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> My classes
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">{register.course_name}</h1>
          <Badge variant={STATE_BADGE[state]}>{STATE_LABEL[state]}</Badge>
        </div>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{register.class_code}</span>
          <span className="inline-flex items-center gap-1.5"><Clock size={14} aria-hidden /> {register.time_range}</span>
          {register.classroom_name && <span className="inline-flex items-center gap-1.5"><DoorOpen size={14} aria-hidden /> {register.classroom_name}</span>}
        </p>
      </div>
      {state === "LIVE" && (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="md" icon={<CheckCheck size={15} />} disabled={waitingCount === 0} onClick={onMarkRemaining}>
            Mark remaining present<Kbd>⇧P</Kbd>
          </Button>
          <Button variant="secondary" size="md" icon={<Save size={15} />} disabled={changedCount === 0} loading={saving} onClick={onSave}>
            Save{changedCount ? ` ${changedCount} change${changedCount === 1 ? "" : "s"}` : ""}<Kbd>Ctrl S</Kbd>
          </Button>
          <Button variant="danger" size="md" icon={<Lock size={15} />} onClick={onStop}>
            Stop &amp; lock<Kbd>Ctrl ↵</Kbd>
          </Button>
        </div>
      )}
      {state === "COMPLETED" && !correcting && (
        <Button variant="secondary" size="md" icon={<Pencil size={15} />} onClick={onCorrect}>
          Correct attendance
        </Button>
      )}
      {correcting && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">Corrections need a reason and are kept in the class history.</p>
          <Button variant="ghost" size="md" disabled={saving} onClick={onCancelCorrection}>
            Cancel
          </Button>
          <Button variant="primary" size="md" icon={<Save size={15} />} disabled={changedCount === 0} loading={saving} onClick={onSave}>
            Save{changedCount ? ` ${changedCount} correction${changedCount === 1 ? "" : "s"}` : ""}
          </Button>
        </div>
      )}
    </header>
  );
}
