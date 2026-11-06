"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Archive, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import useSWR from "swr";
import api, { getApiErrorMessage } from "@/lib/api";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import SelectField from "@/components/ui/SelectField";
import DataTable, { type TableColumn } from "@/components/ui/DataTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { BatchResponse, DepartmentResponse } from "@/types";

const SECTIONS = Array.from({ length: 26 }, (_, i) => {
  const letter = String.fromCharCode(65 + i);
  return { value: letter, label: `Section ${letter}` };
});

type BatchRow = BatchResponse & Record<string, unknown>;

const NO_BATCHES: BatchResponse[] = [];

export default function DepartmentBatchesPanel({ department }: { department: DepartmentResponse }): React.ReactElement {
  const { data, error, isLoading: loading, mutate } = useSWR<BatchResponse[]>(`/admin/departments/${department.id}/batches`);
  const batches = data ?? NO_BATCHES;
  const [section, setSection] = useState("A");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BatchResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fetchBatches = async (): Promise<void> => {
    await mutate();
  };

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, "Failed to load batches"));
  }, [error]);

  const nextCode = useMemo(() => {
    const numbers = batches.filter((b) => b.section === section).map((b) => b.number);
    const next = numbers.length ? Math.max(...numbers) + 1 : 1;
    return next > 99 ? null : `${department.code}-${section}-${next}`;
  }, [batches, section, department.code]);

  async function handleAdd(): Promise<void> {
    setSaving(true);
    try {
      const { data } = await api.post<BatchResponse>(`/admin/departments/${department.id}/batches`, { section });
      toast.success(`${data.code} added`);
      await fetchBatches();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not add batch"));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleArchive(batch: BatchResponse): Promise<void> {
    const next = batch.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
    try {
      await api.patch(`/admin/batches/${batch.id}`, { status: next });
      toast.success(next === "ARCHIVED" ? `${batch.code} archived` : `${batch.code} reactivated`);
      await fetchBatches();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Update failed"));
    }
  }

  async function handleDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/batches/${deleteTarget.id}`);
      toast.success(`${deleteTarget.code} deleted`);
      setDeleteTarget(null);
      await fetchBatches();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  }

  const columns: TableColumn<BatchRow>[] = [
    { key: "code", header: "Batch", sortable: true, render: (r) => <span className="font-semibold text-foreground">{r.code}</span> },
    { key: "student_count", header: "Students", render: (r) => <span>{r.student_count}</span> },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={r.status === "ACTIVE" ? "success" : "neutral"}>
          {r.status === "ACTIVE" ? "Active" : "Archived"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleToggleArchive(r)}
            icon={r.status === "ACTIVE" ? <Archive size={13} /> : <RotateCcw size={13} />}
          >
            {r.status === "ACTIVE" ? "Archive" : "Reactivate"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={r.student_count > 0 || r.class_count > 0}
            onClick={() => setDeleteTarget(r)}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive-soft"
            icon={<Trash2 size={13} />}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">Batches</h2>
        <p className="text-xs text-muted-foreground">Pick a section and add a batch. The number is assigned automatically.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <SelectField label="Section" options={SECTIONS} value={section} onChange={setSection} />
        </div>
        <Button
          variant="primary"
          icon={<Plus size={14} />}
          loading={saving}
          disabled={!nextCode}
          onClick={() => void handleAdd()}
        >
          {nextCode ? `Add ${nextCode}` : "Section is full"}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={batches as BatchRow[]}
        loading={loading}
        emptyMessage="No batches yet. Add batches so students and classes can be placed in them."
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete batch"
        message={`Delete ${deleteTarget?.code ?? "this batch"}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
