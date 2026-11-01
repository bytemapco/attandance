"use client";

import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import { timeSlotSchema, type TimeSlotFormData } from "@/lib/validations/masterData";
import GlassTable, { type TableColumn } from "@/components/ui/GlassTable";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassConfirmDialog from "@/components/ui/GlassConfirmDialog";
import type { TimeSlotResponse } from "@/types";

export interface TimeSlotsTabProps {
  slots: TimeSlotResponse[];
  error: string | null;
  onRefresh: () => Promise<void>;
}

export default function TimeSlotsTab({ slots, error, onRefresh }: TimeSlotsTabProps): React.ReactElement {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TimeSlotFormData>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: { slot_number: slots.length + 1, name: "", start_time: "09:00", end_time: "10:00", is_break: false, is_lab_block: false },
  });

  async function handleSeedStandard(): Promise<void> {
    setSeeding(true);
    try {
      await api.post("/admin/timeslots/seed-standard");
      toast.success("Standard Indian institution schedule added");
      await onRefresh();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Seeding failed"));
    } finally {
      setSeeding(false);
    }
  }

  function openCreateForm(): void {
    reset({ slot_number: slots.length + 1, name: "", start_time: "09:00", end_time: "10:00", is_break: false, is_lab_block: false });
    setFormOpen(true);
  }

  async function onSubmit(formData: TimeSlotFormData): Promise<void> {
    try {
      await api.post("/admin/timeslots", formData);
      toast.success("Time slot added");
      setFormOpen(false);
      await onRefresh();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Creation failed"));
    }
  }

  async function handleDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/timeslots/${deleteTarget}`);
      toast.success("Time slot deleted");
      setDeleteTarget(null);
      await onRefresh();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  }

  const sorted = useMemo(() => [...slots].sort((a, b) => a.slot_number - b.slot_number), [slots]);

  const columns: TableColumn<TimeSlotResponse & Record<string, unknown>>[] = [
    { key: "slot_number", header: "#", sortable: true },
    { key: "name", header: "Name", sortable: true },
    {
      key: "start_time",
      header: "Time",
      render: (row) => <span>{row.start_time} – {row.end_time}</span>,
    },
    {
      key: "is_break",
      header: "Type",
      render: (row) => (
        <div className="flex gap-1.5">
          {row.is_break && <GlassBadge variant="warning">Break</GlassBadge>}
          {row.is_lab_block && <GlassBadge variant="info">Lab Block</GlassBadge>}
          {!row.is_break && !row.is_lab_block && <GlassBadge variant="neutral">Period</GlassBadge>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <GlassButton
          variant="ghost"
          size="sm"
          onClick={() => setDeleteTarget(String(row.id))}
          className="text-muted-foreground hover:text-[#b54242] hover:bg-[#f9eaea]"
          icon={<Trash2 size={13} />}
        />
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {!formOpen && (
        <div className="flex items-center justify-end gap-2">
          <GlassButton variant="secondary" size="sm" icon={<Sparkles size={14} />} loading={seeding} onClick={handleSeedStandard}>
            Use Standard Schedule
          </GlassButton>
          <GlassButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={openCreateForm}>
            Add Slot
          </GlassButton>
        </div>
      )}

      {formOpen && (
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#202b30]">Add Time Slot</h3>
            <button type="button" onClick={() => setFormOpen(false)} className="text-[#718087] hover:text-[#202b30]" aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput label="Slot Number" type="number" min={1} max={50} {...register("slot_number")} error={errors.slot_number?.message} />
              <GlassInput label="Name" placeholder="e.g. Period 1, Lunch" {...register("name")} error={errors.name?.message} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput label="Start Time" type="time" {...register("start_time")} error={errors.start_time?.message} />
              <GlassInput label="End Time" type="time" {...register("end_time")} error={errors.end_time?.message} />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm font-medium text-[#202b30]">
                <input type="checkbox" className="h-4 w-4 rounded border-[#e3e1dc]" {...register("is_break")} />
                Break
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-[#202b30]">
                <input type="checkbox" className="h-4 w-4 rounded border-[#e3e1dc]" {...register("is_lab_block")} />
                Lab Block
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <GlassButton variant="ghost" type="button" onClick={() => setFormOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit" loading={isSubmitting}>
                Add Slot
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      )}

      <GlassTable
        columns={columns}
        data={sorted as (TimeSlotResponse & Record<string, unknown>)[]}
        error={error}
        onRetry={onRefresh}
        emptyMessage="No time slots configured yet"
      />
      <GlassConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Time Slot"
        message="Are you sure you want to delete this time slot? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
