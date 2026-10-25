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
import type { DesignationResponse } from "@/types";

export default function DesignationsPage(): React.ReactElement {
  const router = useRouter();
  const [designations, setDesignations] = useState<DesignationResponse[]>([]);
  const [filtered, setFiltered] = useState<DesignationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchDesignations = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const { data } = await api.get<DesignationResponse[]>("/admin/designations");
      setDesignations(data);
      setFiltered(data);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Failed to load designations");
      setError(msg);
      toast.error(msg);
      setDesignations([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await fetchDesignations();
    })();
  }, [fetchDesignations]);

  const handleSearch = useCallback((q: string) => {
    setPage(1);
    if (!q.trim()) {
      setFiltered(designations);
      return;
    }
    const lq = q.toLowerCase();
    setFiltered(
      designations.filter(
        (d) =>
          d.name.toLowerCase().includes(lq) ||
          d.code.toLowerCase().includes(lq)
      )
    );
  }, [designations]);

  async function handleDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/designations/${deleteTarget}`);
      toast.success("Designation deleted successfully");
      setDeleteTarget(null);
      await fetchDesignations();
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

  const columns: TableColumn<DesignationResponse & Record<string, unknown>>[] = [
    { key: "name", header: "Designation Name", sortable: true },
    { key: "code", header: "Designation Code", sortable: true },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/admin/setup/designations/${row.id}/edit`)}
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
          { label: "Designations" },
        ]}
      />
      <GlassPageHeader
        title="Designations"
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
              onClick={() => router.push("/admin/setup/designations/create")}
            >
              Add Designation
            </GlassButton>
          </div>
        }
      />
      <div>
        <GlassSearch placeholder="Search designations..." onSearch={handleSearch} />
      </div>
      <div className="space-y-3">
        <GlassTable
          columns={columns}
          data={paginatedData as (DesignationResponse & Record<string, unknown>)[]}
          error={error}
          onRetry={fetchDesignations}
          emptyMessage="No designations found"
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
        title="Delete Designation"
        message="Are you sure you want to delete this designation? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={() => void fetchDesignations()}
        entityType="designations"
      />
    </div>
  );
}
