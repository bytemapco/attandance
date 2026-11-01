"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassButton from "@/components/ui/GlassButton";
import GlassSelect from "@/components/ui/GlassSelect";
import type { ClassDetail, ClassSectionItem, ClassroomResponse, TimeSlotResponse } from "@/types";

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface ScheduleDialogProps {
  classId: string;
  section: ClassSectionItem;
  onUpdated: (cls: ClassDetail) => void;
  onClose: () => void;
}

export default function ScheduleDialog({
  classId,
  section,
  onUpdated,
  onClose,
}: ScheduleDialogProps): React.ReactElement {
  const [slots, setSlots] = useState<TimeSlotResponse[]>([]);
  const [rooms, setRooms] = useState<ClassroomResponse[]>([]);
  const [day, setDay] = useState("1");
  const [slotId, setSlotId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [busy, setBusy] = useState(false);
  const basePath = `/admin/class-management/classes/${classId}/sections/${section.id}/schedule`;

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const [slotRes, roomRes] = await Promise.all([
          api.get<TimeSlotResponse[]>("/admin/timeslots"),
          api.get<ClassroomResponse[]>("/admin/classrooms"),
        ]);
        setSlots(slotRes.data.filter((s) => !s.is_break));
        setRooms(roomRes.data);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load time slots and rooms"));
      }
    }
    void load();
  }, []);

  const slotOptions = useMemo(
    () => slots.map((s) => ({ value: s.id, label: `${s.name} · ${s.start_time}–${s.end_time}` })),
    [slots]
  );
  const roomOptions = useMemo(
    () => [{ value: "", label: "No room" }, ...rooms.map((r) => ({ value: r.id, label: r.name }))],
    [rooms]
  );

  async function run(request: () => Promise<{ data: ClassDetail }>, success: string): Promise<void> {
    setBusy(true);
    try {
      const { data } = await request();
      toast.success(success);
      onUpdated(data);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not update the schedule"));
    } finally {
      setBusy(false);
    }
  }

  const addSlot = (): Promise<void> =>
    run(
      () =>
        api.post<ClassDetail>(basePath, {
          day_of_week: Number(day),
          time_slot_id: slotId,
          classroom_id: roomId || undefined,
        }),
      "Class scheduled"
    );

  const removeSlot = (ruleId: string): Promise<void> =>
    run(() => api.delete<ClassDetail>(`${basePath}/${ruleId}`), "Schedule entry removed");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#28363b]/40 p-4 backdrop-blur-xs" onClick={onClose}>
      <div
        className="w-full max-w-lg space-y-4 rounded-2xl border border-[#e3e1dc] bg-card p-6 shadow-[0_8px_24px_rgba(40,54,59,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-[#202b30]">Schedule · {section.subject_name}</h3>
        {section.schedule.length === 0 ? (
          <p className="text-xs text-[#526f78]">No weekly slots yet. The teacher sees a class card only for scheduled slots.</p>
        ) : (
          <ul className="space-y-1.5">
            {section.schedule.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg bg-[#f5f3ee] px-3 py-2 text-sm">
                <span>
                  <span className="font-semibold">{WEEKDAYS[r.day_of_week - 1]}</span> · {r.slot_name} {r.start_time}–{r.end_time}
                  {r.room_name ? ` · ${r.room_name}` : ""}
                </span>
                <button
                  type="button"
                  aria-label="Remove slot"
                  disabled={busy}
                  className="text-[#526f78] hover:text-[#b54242]"
                  onClick={() => void removeSlot(r.id)}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-1 gap-3 border-t border-[#e3e1dc] pt-3 sm:grid-cols-3">
          <GlassSelect
            label="Day"
            value={day}
            onChange={setDay}
            options={WEEKDAYS.map((label, i) => ({ value: String(i + 1), label }))}
          />
          <GlassSelect label="Time slot" placeholder="Select slot" value={slotId} onChange={setSlotId} options={slotOptions} />
          <GlassSelect label="Room" value={roomId} onChange={setRoomId} options={roomOptions} />
        </div>
        <div className="flex justify-end gap-2">
          <GlassButton variant="ghost" size="sm" onClick={onClose}>
            Done
          </GlassButton>
          <GlassButton variant="primary" size="sm" loading={busy} disabled={!slotId} onClick={() => void addSlot()}>
            Add slot
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
