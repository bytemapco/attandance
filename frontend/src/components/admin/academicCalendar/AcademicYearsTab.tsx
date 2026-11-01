"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassTable, { type TableColumn } from "@/components/ui/GlassTable";
import GlassButton from "@/components/ui/GlassButton";
import GlassBadge, { statusToBadgeVariant } from "@/components/ui/GlassBadge";
import GlassConfirmDialog from "@/components/ui/GlassConfirmDialog";
import type { AcademicYearResponse } from "@/types";

export interface AcademicYearsTabProps {
  years: AcademicYearResponse[];
  error: string | null;
  onRefresh: () => Promise<void>;
}

export default function AcademicYearsTab({ years, error, onRefresh }: AcademicYearsTabProps): React.ReactElement {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  async function handleActivate(id: string): Promise<void> {
    setActivatingId(id);
    try {
      await api.post(`/admin/academic-years/${id}/activate`);
      toast.success("Academic year activated — it is now the current session");
      await onRefresh();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Activation failed"));
    } finally {
      setActivatingId(null);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/academic-years/${deleteTarget}`);
      toast.success("Academic year deleted");
      setDeleteTarget(null);
      await onRefresh();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  }

  const sorted = [...years].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const columns: TableColumn<AcademicYearResponse & Record<string, unknown>>[] = [
    { key: "name", header: "Academic Year", sortable: true },
    {
      key: "start_date",
      header: "Duration",
      render: (row) => (
        <span className="text-sm text-[#526f78]">
          {new Date(row.start_date).toLocaleDateString()} – {new Date(row.end_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <GlassBadge variant={statusToBadgeVariant(row.status)}>{row.status}</GlassBadge>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status !== "ACTIVE" && (
            <GlassButton
              variant="ghost"
              size="sm"
              loading={activatingId === String(row.id)}
              onClick={() => handleActivate(String(row.id))}
              icon={<CheckCircle2 size={13} />}
            >
              Set as Current
            </GlassButton>
          )}
          <GlassButton variant="ghost" size="sm" onClick={() => router.push(`/admin/master-data/academic-years/${row.id}`)}>
            Manage
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/master-data/academic-years/${row.id}/edit`)}
            icon={<Pencil size={13} />}
          />
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
      <div className="flex items-center justify-end">
        <GlassButton
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => router.push("/admin/master-data/academic-years/create")}
        >
          Add Academic Year
        </GlassButton>
      </div>
      <GlassTable
        columns={columns}
        data={sorted as (AcademicYearResponse & Record<string, unknown>)[]}
        error={error}
        onRetry={onRefresh}
        emptyMessage="No academic years yet — add one to get started"
      />
      <GlassConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Academic Year"
        message="Are you sure you want to delete this academic year? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
