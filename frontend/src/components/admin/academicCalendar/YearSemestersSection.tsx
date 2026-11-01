"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import { semesterSchema, type SemesterFormData } from "@/lib/validations/masterData";
import GlassTable, { type TableColumn } from "@/components/ui/GlassTable";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassConfirmDialog from "@/components/ui/GlassConfirmDialog";
import type { SemesterResponse } from "@/types";

const ORDINAL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
const ordinal = (n: number): string => ORDINAL[n] || `${n}th`;

export default function YearSemestersSection({ yearId }: { yearId: string }): React.ReactElement {
  const [semesters, setSemesters] = useState<SemesterResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SemesterFormData>({
    resolver: zodResolver(semesterSchema),
    defaultValues: { number: 1, start_date: "", end_date: "" },
  });

  const fetchSemesters = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<SemesterResponse[]>("/admin/semesters", { params: { academic_year_id: yearId } });
      setSemesters(data.sort((a, b) => a.number - b.number));
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to load semesters"));
    } finally {
      setLoading(false);
    }
  }, [yearId]);

  useEffect(() => {
    void fetchSemesters();
  }, [fetchSemesters]);

  function openCreateForm(): void {
    reset({ number: semesters.length + 1, start_date: "", end_date: "" });
    setEditingId(null);
    setFormOpen(true);
  }

  function openEditForm(sem: SemesterResponse): void {
    reset({ number: sem.number, start_date: sem.start_date, end_date: sem.end_date });
    setEditingId(sem.id);
    setFormOpen(true);
  }

  async function onSubmit(formData: SemesterFormData): Promise<void> {
    try {
      if (editingId) {
        await api.put(`/admin/semesters/${editingId}`, formData);
        toast.success("Semester updated");
      } else {
        await api.post(`/admin/academic-years/${yearId}/semesters`, formData);
        toast.success("Semester added");
      }
      setFormOpen(false);
      setEditingId(null);
      await fetchSemesters();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Save failed"));
    }
  }

  async function handleDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/semesters/${deleteTarget}`);
      toast.success("Semester deleted");
      setDeleteTarget(null);
      await fetchSemesters();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<SemesterResponse & Record<string, unknown>>[] = [
    {
      key: "number",
      header: "Semester",
      render: (row) => <span className="font-medium text-[#202b30]">{ordinal(row.number)} Semester</span>,
    },
    {
      key: "start_date",
      header: "Duration",
      render: (row) => (
        <span className="text-sm text-[#526f78]">
          {new Date(row.start_date).toLocaleDateString()} – {new Date(row.end_date).toLocaleDateString()}
        </span>
      ),
    },
    { key: "classes_count", header: "Classes", render: (row) => <span>{row.classes_count ?? 0}</span> },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <GlassButton variant="ghost" size="sm" onClick={() => openEditForm(row)} icon={<Pencil size={13} />} />
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(String(row.id))}
            className="text-muted-foreground hover:text-[#b54242] hover:bg-[#f9eaea]"
            icon={<Trash2 size={13} />}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#202b30]">Semesters</h2>
        {!formOpen && (
          <GlassButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={openCreateForm}>
            Add Semester
          </GlassButton>
        )}
      </div>

      {formOpen && (
        <GlassCard padding="sm" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#202b30]">{editingId ? "Edit Semester" : "Add Semester"}</h3>
            <button type="button" onClick={() => setFormOpen(false)} className="text-[#718087] hover:text-[#202b30]" aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <GlassInput label="Semester Number" type="number" min={1} max={12} {...register("number")} error={errors.number?.message} />
              <GlassInput label="Start Date" type="date" {...register("start_date")} error={errors.start_date?.message} />
              <GlassInput label="End Date" type="date" {...register("end_date")} error={errors.end_date?.message} />
            </div>
            <div className="flex justify-end gap-3">
              <GlassButton variant="ghost" type="button" onClick={() => setFormOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit" loading={isSubmitting}>
                {editingId ? "Save Changes" : "Add Semester"}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      )}

      <GlassTable
        columns={columns}
        data={semesters as (SemesterResponse & Record<string, unknown>)[]}
        loading={loading}
        emptyMessage="No semesters added yet"
      />
      <GlassConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Semester"
        message="Are you sure you want to delete this semester? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
