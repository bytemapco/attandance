"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorState from "@/components/ui/ErrorState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import ReasonDialog from "@/components/ui/ReasonDialog";
import { occurrenceState } from "../occurrenceState";
import RegisterGrid from "./RegisterGrid";
import { changedStudents, displayStatus, flaggedForReview, pendingFlagsText, tally, type MarkStatus } from "./registerStatus";
import ReviewQueue, { showReviewQueue } from "./ReviewQueue";
import ReviewReasonDialog from "./ReviewReasonDialog";
import SessionHeader from "./SessionHeader";
import SessionPanel from "./SessionPanel";
import { useFlaggedReview } from "./useFlaggedReview";
import { useRegisterData } from "./useRegisterData";
import { useSessionShortcuts } from "./useSessionShortcuts";
import { useWarnBeforeLeaving } from "./useWarnBeforeLeaving";

type Busy = "save" | "stop" | "start" | null;

export default function OccurrenceAttendancePage(): React.ReactElement {
  const { occurrenceId } = useParams<{ occurrenceId: string }>();
  const { base, register, edits, setEdits, failed, load, refresh } = useRegisterData(occurrenceId);
  const [busy, setBusy] = useState<Busy>(null);
  const [confirmStop, setConfirmStop] = useState(false);
  const [correcting, setCorrecting] = useState(false);
  const [askReason, setAskReason] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const state = register ? occurrenceState(register) : "NOT_STARTED";
  const locked = state === "COMPLETED" || state === "CANCELLED";
  const live = state === "LIVE";
  const editable = live || correcting;

  const students = useMemo(() => register?.students ?? [], [register]);
  const changed = useMemo(() => changedStudents(students, edits, locked), [students, edits, locked]);
  const counts = useMemo(() => tally(students, edits, locked), [students, edits, locked]);
  const flagged = useMemo(() => flaggedForReview(students, edits), [students, edits]);
  const review = useFlaggedReview({ base, locked, refresh });

  useWarnBeforeLeaving(changed.length > 0);

  const saveChanges = (reason?: string): Promise<unknown> =>
    api.put(`${base}/register`, {
      occurrence_id: occurrenceId,
      updates: changed.map((s) => ({ student_id: s.student_id, status: edits[s.student_id] })),
      reason,
    });

  async function run(kind: Exclude<Busy, null>, action: () => Promise<unknown>, done: string): Promise<boolean> {
    setBusy(kind);
    try {
      await action();
      toast.success(done);
      await load();
      return true;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Action failed"));
      return false;
    } finally {
      setBusy(null);
      setConfirmStop(false);
    }
  }

  const save = (): void => {
    if (!editable || changed.length === 0 || busy) return;
    if (correcting) {
      setAskReason(true);
      return;
    }
    void run("save", () => saveChanges(), `Saved ${changed.length} change${changed.length === 1 ? "" : "s"}`);
  };

  async function saveCorrection(reason: string): Promise<void> {
    const saved = await run("save", () => saveChanges(reason), "Correction saved and kept in the class history");
    if (!saved) return;
    setAskReason(false);
    setCorrecting(false);
  }

  const cancelCorrection = (): void => {
    setCorrecting(false);
    setEdits({});
  };

  const stop = (): void =>
    void run(
      "stop",
      async () => {
        if (changed.length > 0) await saveChanges();
        await api.post(`${base}/stop`);
      },
      "Attendance submitted and locked"
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
    enabled: !!register && !confirmStop && !review.needsReason,
    onSave: save,
    onStop: () => live && setConfirmStop(true),
    onMarkRemaining: markRemainingPresent,
    onToggleFullscreen: () => live && setFullscreen((open) => !open),
    onEscape: () => setFullscreen(false),
  });

  if (failed) return <ErrorState message="This class could not be loaded." onRetry={() => void load()} />;
  if (!register) return <PageSkeleton />;

  return (
    <div className="flex flex-col gap-5 lg:h-[calc(100dvh-7.5rem)]">
      <SessionHeader
        register={register}
        state={state}
        changedCount={changed.length}
        waitingCount={counts.WAITING}
        flaggedCount={counts.FLAGGED}
        saving={busy === "save"}
        correcting={correcting}
        onMarkRemaining={markRemainingPresent}
        onSave={save}
        onStop={() => setConfirmStop(true)}
        onCorrect={() => setCorrecting(true)}
        onCancelCorrection={cancelCorrection}
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
          onShowFlagged={showReviewQueue}
        />
        <div className="flex flex-col gap-4 lg:min-h-0">
          <ReviewQueue items={flagged} deciding={review.deciding} onDecide={review.decide} />
          <RegisterGrid
            students={students}
            edits={edits}
            counts={counts}
            locked={locked || state === "NOT_STARTED"}
            editable={editable}
            shortcutsEnabled={!confirmStop && !fullscreen && !review.needsReason}
            onMark={markStudent}
          />
        </div>
      </div>
      <ConfirmDialog
        isOpen={confirmStop}
        title="Stop and lock attendance"
        message={`${counts.WAITING} student${counts.WAITING === 1 ? "" : "s"} still waiting will be recorded absent (or on leave if their leave is approved), and the register will be locked.${pendingFlagsText(counts.FLAGGED)}${changed.length ? ` Your ${changed.length} unsaved change${changed.length === 1 ? "" : "s"} will be saved first.` : ""}`}
        confirmLabel="Stop & lock"
        loading={busy === "stop"}
        onConfirm={stop}
        onCancel={() => setConfirmStop(false)}
      />
      {askReason && (
        <ReasonDialog
          title="Why are you correcting this register?"
          confirmLabel="Save correction"
          loading={busy === "save"}
          onConfirm={(reason) => void saveCorrection(reason)}
          onCancel={() => setAskReason(false)}
        />
      )}
      {review.needsReason && (
        <ReviewReasonDialog
          student={review.needsReason.student}
          decision={review.needsReason.decision}
          loading={review.deciding !== null}
          onConfirm={(reason) => void review.confirmReason(reason)}
          onCancel={review.cancelReason}
        />
      )}
    </div>
  );
}
