"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload } from "lucide-react";
import api from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassTable from "@/components/ui/GlassTable";
import EnterpriseTableToolbar, { type ToolbarFilterConfig } from "@/components/ui/EnterpriseTableToolbar";
import EnterprisePagination from "@/components/ui/EnterprisePagination";
import BulkImportModal from "@/components/admin/BulkImportModal";
import { useTableQuery } from "@/hooks/useTableQuery";
import { teacherColumns } from "./teacher-columns";
import type { TeacherResponse, DepartmentResponse } from "@/types";

export default function TeachersPage(): React.ReactElement {
  const router = useRouter();
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [designations, setDesignations] = useState<{ value: string; label: string }[]>([]);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Filter States
  const [department, setDepartment] = useState<string>("all");
  const [designation, setDesignation] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const extraParams = useMemo(() => ({
    department_id: department !== "all" ? department : undefined,
    designation_id: designation !== "all" ? designation : undefined,
    status: status !== "all" ? status : undefined,
  }), [department, designation, status]);

  const {
    data: teachers,
    totalItems,
    loading,
    searchQuery,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    setSearchQuery,
    setCurrentPage,
    setPageSize,
    handleSort,
    refetch,
    error,
  } = useTableQuery<TeacherResponse>({
    endpoint: "/admin/users/teachers",
    defaultPageSize: 10,
    defaultSortBy: "created_at",
    defaultSortOrder: "desc",
    extraParams,
  });

  useEffect(() => {
    async function loadMetadata(): Promise<void> {
      try {
        const [deptRes, desigRes] = await Promise.allSettled([
          api.get<DepartmentResponse[]>("/admin/departments"),
          api.get<{ id: string; name: string }[]>("/admin/designations"),
        ]);
        if (deptRes.status === "fulfilled") {
          setDepartments(deptRes.value.data.map((d) => ({ value: d.id, label: d.name })));
        }
        if (desigRes.status === "fulfilled") {
          setDesignations(desigRes.value.data.map((d) => ({ value: d.id, label: d.name })));
        }
      } catch {
        setDepartments([]);
        setDesignations([]);
      }
    }
    void loadMetadata();
  }, []);

  const handleResetAll = (): void => {
    setSearchQuery("");
    setDepartment("all");
    setDesignation("all");
    setStatus("all");
    setCurrentPage(1);
  };

  const toolbarFilters: ToolbarFilterConfig[] = [
    {
      id: "department",
      label: "Department",
      options: departments,
      value: department,
      onChange: (val) => { setDepartment(val); setCurrentPage(1); },
    },
    {
      id: "designation",
      label: "Academic Rank",
      options: designations,
      value: designation,
      onChange: (val) => { setDesignation(val); setCurrentPage(1); },
    },
    {
      id: "status",
      label: "Status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
      value: status,
      onChange: (val) => { setStatus(val); setCurrentPage(1); },
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in-up">
      <GlassBreadcrumb items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Users" }, { label: "Teachers" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Faculty
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
            onClick={() => router.push("/admin/users/teachers/add")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Plus size={14} /> Add Teacher
          </button>
        </div>
      </div>

      <EnterpriseTableToolbar
        searchPlaceholder="Search by name, email, employee ID..."
        searchValue={searchQuery}
        onSearch={setSearchQuery}
        filters={toolbarFilters}
        onResetAll={handleResetAll}
      />

      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        <GlassTable
          columns={teacherColumns}
          data={teachers as (TeacherResponse & Record<string, unknown>)[]}
          loading={loading}
          error={error}
          onRetry={refetch}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSort}
          emptyMessage="No teachers found"
        />
        <EnterprisePagination
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="teachers"
        />
      </div>

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        entityType="teachers"
        onSuccess={() => void refetch()}
      />
    </div>
  );
}



