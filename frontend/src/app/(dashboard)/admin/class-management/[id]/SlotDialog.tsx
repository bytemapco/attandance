"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Input from "@/components/ui/Input";
import SelectField from "@/components/ui/SelectField";
import ModalFrame from "@/components/ui/ModalFrame";
import type { ClassDetail } from "@/types";
import DayPicker from "./DayPicker";
import { schedulePath } from "./scheduleApi";
import { saveSlot, type SlotDraft } from "./slotSave";
import { useSlotOptions } from "./useSlotOptions";

interface SlotDialogProps {
  cls: ClassDetail;
  draft: SlotDraft;
  onUpdated: (cls: ClassDetail) => void;
  onClose: () => void;
}

export default function SlotDialog({ cls, draft, onUpdated, onClose }: SlotDialogProps): React.ReactElement {
  const editing = draft.ruleId !== undefined;
  const initial = cls.sections.find((s) => s.id === draft.sectionId);
  const { rooms, subjectOptions, teacherOptions, roomOptions } = useSlotOptions(cls.department_id);
  const [subjectId, setSubjectId] = useState(initial?.subject_id ?? "");
  const [teacherId, setTeacherId] = useState(initial?.teacher_id ?? "");
  const [days, setDays] = useState<number[]>([draft.day]);
  const [start, setStart] = useState(draft.start);
  const [end, setEnd] = useState(draft.end);
  const [roomChoice, setRoomChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const timesValid = !!start && !!end && end > start;
  const previousRoomId = rooms.find((r) => r.name === draft.roomName)?.id;
  const roomId = roomChoice ?? previousRoomId ?? "";
  const ready = !!subjectId && !!teacherId && timesValid && days.length > 0;
  const subjectName = initial?.subject_name ?? subjectOptions.find((o) => o.value === subjectId)?.label ?? "";

  function pickSubject(id: string): void {
    setSubjectId(id);
    const inClass = cls.sections.find((s) => s.subject_id === id);
    if (inClass?.teacher_id) setTeacherId(inClass.teacher_id);
  }

  async function save(): Promise<void> {
    setBusy(true);
    const result = await saveSlot({
      cls,
      draft,
      subjectId,
      teacherId,
      days,
      previousRoomId,
      input: { start_time: start, end_time: end, classroom_id: roomId || undefined },
    });
    if (result.latest) onUpdated(result.latest);
    setBusy(false);
    if (result.ok) {
      toast.success(editing ? "Class time updated" : "Class time added");
      onClose();
      return;
    }
    toast.error(result.message);
  }

  async function removeTime(): Promise<void> {
    if (!initial || !draft.ruleId) return;
    setBusy(true);
    try {
      const { data } = await api.delete<ClassDetail>(`${schedulePath(cls.id, initial.id)}/${draft.ruleId}`);
      toast.success("Class time removed");
      onUpdated(data);
      onClose();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not remove the class time"));
      setBusy(false);
    }
  }

  async function removeSubject(): Promise<void> {
    if (!initial) return;
    setBusy(true);
    try {
      const { data } = await api.delete<ClassDetail>(`/admin/class-management/classes/${cls.id}/sections/${initial.id}`);
      toast.success(`${initial.subject_name} removed from the class`);
      onUpdated(data);
      onClose();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not remove the subject"));
      setConfirmingRemove(false);
      setBusy(false);
    }
  }

  return (
    <>
    <ModalFrame label={editing ? "Change class time" : "Add class time"} onClose={onClose} className="space-y-4 p-6">
      <h3 className="text-base font-semibold text-foreground">{editing ? "Change class time" : "Add class time"}</h3>
      {editing ? (
        <p className="text-sm font-semibold text-foreground">{subjectName}</p>
      ) : (
        <SelectField label="Subject" placeholder="Select subject" searchable value={subjectId} onChange={pickSubject} options={subjectOptions} />
      )}
      <SelectField label="Teacher" placeholder="Select teacher" searchable value={teacherId} onChange={setTeacherId} options={teacherOptions} />
      <DayPicker value={days} onChange={setDays} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input label="Starts" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        <Input label="Ends" type="time" value={end} onChange={(e) => setEnd(e.target.value)} error={start && end && !timesValid ? "Must be after start" : undefined} />
        <SelectField label="Room" value={roomId} onChange={setRoomChoice} options={roomOptions} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {editing ? (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" disabled={busy} className="text-destructive" onClick={() => void removeTime()}>
              Remove time
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} className="text-destructive" onClick={() => setConfirmingRemove(true)}>
              Remove subject
            </Button>
          </div>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={busy} disabled={!ready} onClick={() => void save()}>
            {editing ? "Save" : days.length > 1 ? `Add to ${days.length} days` : "Add"}
          </Button>
        </div>
      </div>
    </ModalFrame>
    <ConfirmDialog
      isOpen={confirmingRemove}
      title="Remove subject"
      message={`Remove ${subjectName} from ${cls.code}? All its class times are deleted too. This is blocked once attendance has been recorded.`}
      confirmLabel="Remove"
      loading={busy}
      onConfirm={() => void removeSubject()}
      onCancel={() => setConfirmingRemove(false)}
    />
    </>
  );
}
