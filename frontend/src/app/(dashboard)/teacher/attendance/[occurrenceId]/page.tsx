"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassConfirmDialog from "@/components/ui/GlassConfirmDialog";
import GlassErrorState from "@/components/ui/GlassErrorState";
import GlassLoader from "@/components/ui/GlassLoader";
import type { OccurrenceRegisterData } from "@/types";
import { occurrenceState } from "../occurrenceState";
import RegisterGrid from "./RegisterGrid";
import { changedStudents, displayStatus, tally, type Edits, type MarkStatus } from "./registerStatus";
import SessionHeader from "./SessionHeader";
import SessionPanel from "./SessionPanel";
import { useSessionShortcuts } from "./useSessionShortcuts";

const LIVE_REFRESH_MS = 5000;

type Busy = "save" | "stop" | "start" | null;

export default function OccurrenceAttendancePage(): React.ReactElement {
  const { occurrenceId } = useParams<{ occurrenceId: string }>();
  const [register, setRegister] = useState<OccurrenceRegisterData | null>(null);
  const [edits, setEdits] = useState<Edits>({});
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [confirmStop, setConfirmStop] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const base = `/faculty/occurrences/${occurrenceId}`;

  const load = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<OccurrenceRegisterData>(`${base}/register`);
      setRegister(data);
      setEdits({});
      setFailed(false);
    } catch (err: unknown) {
      setFailed(true);
      toast.error(getApiErrorMessage(err, "Could not load the attendance register"));
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  const state = register ? occurrenceState(register) : "NOT_STARTED";
  const locked = state === "COMPLETED" || state === "CANCELLED";
  const live = state === "LIVE";

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => {
      void api
        .get<OccurrenceRegisterData>(`${base}/register`)
        .then(({ data }) => setRegister(data))
        .catch(() => undefined);
    }, LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [live, base]);

  const students = useMemo(() => register?.students ?? [], [register]);
  const changed = useMemo(() => changedStudents(students, edits, locked), [students, edits, locked]);
  const counts = useMemo(() => tally(students, edits, locked), [students, edits, locked]);

  useEffect(() => {
    if (changed.length === 0) return;
    const warn = (e: BeforeUnloadEvent): void => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed.length]);

  const saveChanges = (): Promise<unknown> =>
    api.put(`${base}/register`, {
      occurrence_id: occurrenceId,
      updates: changed.map((s) => ({ student_id: s.student_id, status: edits[s.student_id] })),
    });

  async function run(kind: Exclude<Busy, null>, action: () => Promise<unknown>, done: string): Promise<void> {
    setBusy(kind);
    try {
      await action();
      toast.success(done);
      await load();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Action failed"));
    } finally {
      setBusy(null);
      setConfirmStop(false);
    }
  }

  const save = (): void => {
    if (!live || changed.length === 0 || busy) return;
    void run("save", saveChanges, `Saved ${changed.length} change${changed.length === 1 ? "" : "s"}`);
  };

  const stop = (): void =>
    void run(
      "stop",
      async () => {
        if (changed.length > 0) await saveChanges();
        await api.post(`${base}/stop`);
      },
      "Attendance closed and locked"
    );

  const markRemainingPresent = (): void => {
    if (!live) return;
    const waiting = students.filter((s) => displayStatus(s, edits, locked) === "WAITING");
    setEdits((prev) => ({ ...prev, ...Object.fromEntries(waiting.map((s) => [s.student_id, "PRESENT" as MarkStatus])) }));
  };

  const markStudent = (studentId: string, status: MarkStatus | null): void =>
    setEdits((prev) => {
      const next = { ...prev };
      if (status) next[studentId] = status;
      else delete next[studentId];
      return next;
    });

  useSessionShortcuts({
    enabled: !!register && !confirmStop,
    onSave: save,
    onStop: () => live && setConfirmStop(true),
    onMarkRemaining: markRemainingPresent,
    onToggleFullscreen: () => live && setFullscreen((open) => !open),
    onEscape: () => setFullscreen(false),
  });

  if (failed) return <GlassErrorState message="This class could not be loaded." onRetry={() => void load()} />;
  if (!register) return <GlassLoader />;

  return (
    <div className="flex flex-col gap-5 lg:h-[calc(100dvh-7.5rem)]">
      <SessionHeader
        register={register}
        state={state}
        changedCount={changed.length}
        waitingCount={counts.WAITING}
        saving={busy === "save"}
        onMarkRemaining={markRemainingPresent}
        onSave={save}
        onStop={() => setConfirmStop(true)}
      />
      <div className="grid gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <SessionPanel
          occurrenceId={occurrenceId}
          state={state}
          counts={counts}
          closesAt={register.verification_expires}
          starting={busy === "start"}
          fullscreen={fullscreen}
          onStart={() => void run("start", () => api.post(`${base}/start`), "Attendance started")}
          onFullscreenChange={setFullscreen}
        />
        <RegisterGrid
          students={students}
          edits={edits}
          counts={counts}
          locked={locked || state === "NOT_STARTED"}
          shortcutsEnabled={!confirmStop && !fullscreen}
          onMark={markStudent}
        />
      </div>
      <GlassConfirmDialog
        isOpen={confirmStop}
        title="Stop and lock attendance"
        message={`${counts.WAITING} student${counts.WAITING === 1 ? "" : "s"} still waiting will be recorded absent (or on leave if their leave is approved), and the register will be locked.${changed.length ? ` Your ${changed.length} unsaved change${changed.length === 1 ? "" : "s"} will be saved first.` : ""}`}
        confirmLabel="Stop & lock"
        loading={busy === "stop"}
        onConfirm={stop}
        onCancel={() => setConfirmStop(false)}
      />
    </div>
  );
}
