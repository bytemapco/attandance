"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload } from "lucide-react";
import api from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassTable from "@/components/ui/GlassTable";
import EnterpriseTableToolbar from "@/components/ui/EnterpriseTableToolbar";
import EnterprisePagination from "@/components/ui/EnterprisePagination";
import BulkImportModal from "@/components/admin/BulkImportModal";
import { useTableQuery } from "@/hooks/useTableQuery";
import { classColumns } from "./ClassColumns";
import type { ClassResponse, SubjectResponse } from "@/types";

export default function ClassesPage(): React.ReactElement {
  const router = useRouter();
  const [subjects, setSubjects] = useState<{ value: string; label: string }[]>([]);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const {
    data: classes,
    totalItems,
    loading,
    searchQuery,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    filterValue,
    setSearchQuery,
    setCurrentPage,
    setPageSize,
    handleSort,
    setFilterValue,
    refetch,
    error,
  } = useTableQuery<ClassResponse>({
    endpoint: "/admin/classes",
    defaultPageSize: 10,
    defaultSortBy: "created_at",
    defaultSortOrder: "desc",
  });

  useEffect(() => {
    async function loadSubjects(): Promise<void> {
      try {
        const { data } = await api.get<SubjectResponse[]>("/admin/subjects");
        setSubjects(data.map((s) => ({ value: s.id, label: s.name })));
      } catch {
        setSubjects([]);
      }
    }
    void loadSubjects();
  }, []);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <GlassBreadcrumb items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Classes" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Classes
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-secondary transition-colors shadow-2xs"
          >
            <Upload size={13} /> Bulk Import
          </button>
          <button
            onClick={() => router.push("/admin/classes/create")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Plus size={14} /> Create Class
          </button>
        </div>
      </div>

      <EnterpriseTableToolbar
        searchPlaceholder="Search by class name or subject..."
        searchValue={searchQuery}
        onSearch={setSearchQuery}
        filterLabel="Subject"
        filterOptions={subjects}
        selectedFilter={filterValue}
        onFilterChange={setFilterValue}
      />

      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        <GlassTable
          columns={classColumns}
          data={classes as (ClassResponse & Record<string, unknown>)[]}
          loading={loading}
          error={error}
          onRetry={refetch}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSort}
          emptyMessage="No classes found"
        />
        <EnterprisePagination
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="classes"
        />
      </div>

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        entityType="classes"
        onSuccess={() => void refetch()}
      />
    </div>
  );
}

