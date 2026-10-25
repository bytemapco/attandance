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
import type { SubjectResponse } from "@/types";

export default function SubjectsPage(): React.ReactElement {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [filtered, setFiltered] = useState<SubjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchSubjects = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const { data } = await api.get<SubjectResponse[]>("/admin/subjects");
      setSubjects(data);
      setFiltered(data);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Failed to load subjects");
      setError(msg);
      toast.error(msg);
      setSubjects([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchSubjects();
    })();
  }, [fetchSubjects]);

  const handleSearch = useCallback((q: string) => {
    setPage(1);
    if (!q.trim()) {
      setFiltered(subjects);
      return;
    }
    const lq = q.toLowerCase();
    setFiltered(
      subjects.filter(
        (s) =>
          s.name.toLowerCase().includes(lq) ||
          s.code.toLowerCase().includes(lq)
      )
    );
  }, [subjects]);

  async function handleDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/subjects/${deleteTarget}`);
      toast.success("Subject deleted successfully");
      setDeleteTarget(null);
      await fetchSubjects();
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

  const columns: TableColumn<SubjectResponse & Record<string, unknown>>[] = [
    { key: "name", header: "Subject Name", sortable: true },
    { key: "code", header: "Subject Code", sortable: true },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/admin/setup/subjects/${row.id}/edit`)}
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
          { label: "Subjects" },
        ]}
      />
      <GlassPageHeader
        title="Subjects"
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
              onClick={() => router.push("/admin/setup/subjects/create")}
            >
              Add Subject
            </GlassButton>
          </div>
        }
      />
      <div>
        <GlassSearch placeholder="Search subjects..." onSearch={handleSearch} />
      </div>
      <div className="space-y-3">
        <GlassTable
          columns={columns}
          data={paginatedData as (SubjectResponse & Record<string, unknown>)[]}
          error={error}
          onRetry={fetchSubjects}
          emptyMessage="No subjects found"
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
        title="Delete Subject"
        message="Are you sure you want to delete this subject? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        entityType="subjects"
        onSuccess={() => void fetchSubjects()}
      />
    </div>
  );
}
