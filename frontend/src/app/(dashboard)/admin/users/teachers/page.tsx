"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload } from "lucide-react";
import api from "@/lib/api";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import TableToolbar, { type ToolbarFilterConfig } from "@/components/ui/TableToolbar";
import Pagination from "@/components/ui/Pagination";
import BulkImportModal from "@/components/admin/BulkImportModal";
import { useTableQuery } from "@/hooks/useTableQuery";
import { teacherColumns } from "./TeacherColumns";
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

  const hasFilters = searchQuery.trim() !== "" || department !== "all" || designation !== "all" || status !== "all";

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
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Users" }, { label: "Teachers" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Faculty
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<Upload size={14} />} onClick={() => setIsBulkImportOpen(true)}>
            Bulk import
          </Button>
          <Button icon={<Plus size={14} />} onClick={() => router.push("/admin/users/teachers/add")}>
            Add teacher
          </Button>
        </div>
      </div>

      <TableToolbar
        searchPlaceholder="Search by name, email, employee ID..."
        searchValue={searchQuery}
        onSearch={setSearchQuery}
        filters={toolbarFilters}
        onResetAll={handleResetAll}
      />

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <DataTable
          columns={teacherColumns}
          data={teachers as (TeacherResponse & Record<string, unknown>)[]}
          loading={loading}
          error={error}
          onRetry={refetch}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSort}
          emptyMessage={
            hasFilters
              ? "No teachers match these filters."
              : "No teachers yet. Add one, or import a CSV to add many at once."
          }
        />
        <Pagination
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



