"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassTable, { type TableColumn } from "@/components/ui/GlassTable";
import GlassSearch from "@/components/ui/GlassSearch";
import GlassButton from "@/components/ui/GlassButton";
import GlassConfirmDialog from "@/components/ui/GlassConfirmDialog";
import GlassLoader from "@/components/ui/GlassLoader";
import EnterprisePagination from "@/components/ui/EnterprisePagination";
import BulkImportModal from "@/components/admin/BulkImportModal";
import type { ClassroomResponse } from "@/types";

export default function ClassroomsPage(): React.ReactElement {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<ClassroomResponse[]>([]);
  const [filtered, setFiltered] = useState<ClassroomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchClassrooms = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const { data } = await api.get<ClassroomResponse[]>("/admin/classrooms");
      setClassrooms(data);
      setFiltered(data);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Failed to load classrooms");
      setError(msg);
      toast.error(msg);
      setClassrooms([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchClassrooms();
    })();
  }, [fetchClassrooms]);

  const handleSearch = useCallback((q: string) => {
    setPage(1);
    if (!q.trim()) {
      setFiltered(classrooms);
      return;
    }
    const lq = q.toLowerCase();
    setFiltered(
      classrooms.filter(
        (c) =>
          c.name.toLowerCase().includes(lq) ||
          (c.building && c.building.toLowerCase().includes(lq))
      )
    );
  }, [classrooms]);

  async function handleDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/classrooms/${deleteTarget}`);
      toast.success("Classroom deleted successfully");
      setDeleteTarget(null);
      await fetchClassrooms();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  }

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const columns: TableColumn<ClassroomResponse & Record<string, unknown>>[] = [
    { key: "name", header: "Classroom Name", sortable: true },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/admin/setup/classrooms/${row.id}/edit`)}
            className="glass-btn glass-btn-ghost glass-btn-sm"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={() => setDeleteTarget(String(row.id))}
            className="glass-btn glass-btn-ghost glass-btn-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <GlassLoader />;

  return (
    <div className="animate-fade-in-up space-y-4">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Setup" },
          { label: "Classrooms" },
        ]}
      />
      <GlassPageHeader
        title="Classrooms"
        actions={
          <div className="flex items-center gap-3">
            <GlassButton
              variant="secondary"
              icon={<Upload size={16} />}
              onClick={() => setIsBulkImportOpen(true)}
            >
              Import CSV
            </GlassButton>
            <GlassButton
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => router.push("/admin/setup/classrooms/create")}
            >
              Add Classroom
            </GlassButton>
          </div>
        }
      />
      <div>
        <GlassSearch placeholder="Search classrooms..." onSearch={handleSearch} />
      </div>
      <div className="space-y-3">
        <GlassTable
          columns={columns}
          data={paginatedData as (ClassroomResponse & Record<string, unknown>)[]}
          error={error}
          onRetry={fetchClassrooms}
          emptyMessage="No classrooms found"
        />
        <EnterprisePagination
          currentPage={page}
          pageSize={pageSize}
          totalItems={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </div>
      <GlassConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Classroom"
        message="Are you sure you want to delete this classroom? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        entityType="classrooms"
        onSuccess={() => void fetchClassrooms()}
      />
    </div>
  );
}
