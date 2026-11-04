"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload } from "lucide-react";
import api from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassButton from "@/components/ui/GlassButton";
import GlassTable from "@/components/ui/GlassTable";
import EnterpriseTableToolbar, { type ToolbarFilterConfig } from "@/components/ui/EnterpriseTableToolbar";
import EnterprisePagination from "@/components/ui/EnterprisePagination";
import BulkImportModal from "@/components/admin/BulkImportModal";
import { useTableQuery } from "@/hooks/useTableQuery";
import { studentColumns } from "./StudentColumns";
import { useStudentFacets } from "./useStudentFacets";
import type { BatchResponse, StudentResponse, DepartmentResponse, StudentFilterFacetsResponse } from "@/types";

export default function StudentsPage(): React.ReactElement {
  const router = useRouter();
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [facets, setFacets] = useState<StudentFilterFacetsResponse>({ semesters: [] });
  const [batchFilterOptions, setBatchFilterOptions] = useState<{ value: string; label: string }[]>([]);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const [department, setDepartment] = useState<string>("all");
  const [semester, setSemester] = useState<string>("all");
  const [batch, setBatch] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const extraParams = useMemo(() => ({
    department_id: department !== "all" ? department : undefined,
    semester: semester !== "all" ? Number(semester) : undefined,
    batch_id: batch !== "all" ? batch : undefined,
    status: status !== "all" ? status : undefined,
  }), [department, semester, batch, status]);

  const {
    data: students,
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
  } = useTableQuery<StudentResponse>({
    endpoint: "/admin/users/students",
    defaultPageSize: 10,
    defaultSortBy: "created_at",
    defaultSortOrder: "desc",
    extraParams,
  });

  const hasFilters = searchQuery.trim() !== "" || department !== "all" || semester !== "all" || batch !== "all" || status !== "all";

  useEffect(() => {
    async function loadMetadata(): Promise<void> {
      try {
        const [deptRes, facetRes] = await Promise.allSettled([
          api.get<DepartmentResponse[]>("/admin/departments"),
          api.get<StudentFilterFacetsResponse>("/admin/users/students/facets"),
        ]);
        const batchRes = await api.get<BatchResponse[]>("/admin/batches").catch(() => ({ data: [] as BatchResponse[] }));
        setBatchFilterOptions(batchRes.data.map((b) => ({ value: b.id, label: b.code })));
        if (deptRes.status === "fulfilled") {
          setDepartments(deptRes.value.data.map((d) => ({ value: d.id, label: d.name })));
        }
        if (facetRes.status === "fulfilled") {
          setFacets(facetRes.value.data);
        }
      } catch {
        setDepartments([]);
      }
    }
    void loadMetadata();
  }, []);

  const { semesterOptions } = useStudentFacets({
    facets,
    students,
  });

  const handleResetAll = (): void => {
    setSearchQuery("");
    setDepartment("all");
    setSemester("all");
    setBatch("all");
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
      id: "semester",
      label: "Semester",
      options: semesterOptions,
      value: semester,
      onChange: (val) => { setSemester(val); setCurrentPage(1); },
    },
    {
      id: "batch",
      label: "Batch",
      options: batchFilterOptions,
      value: batch,
      onChange: (val) => { setBatch(val); setCurrentPage(1); },
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
      <GlassBreadcrumb items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Users" }, { label: "Students" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border">
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Students</h1>
        <div className="flex items-center gap-2">
          <GlassButton variant="secondary" icon={<Upload size={14} />} onClick={() => setIsBulkImportOpen(true)}>
            Bulk import
          </GlassButton>
          <GlassButton icon={<Plus size={14} />} onClick={() => router.push("/admin/users/students/add")}>
            Add student
          </GlassButton>
        </div>
      </div>

      <EnterpriseTableToolbar
        searchPlaceholder="Search by name, email, login ID..."
        searchValue={searchQuery}
        onSearch={setSearchQuery}
        filters={toolbarFilters}
        onResetAll={handleResetAll}
      />

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <GlassTable
          columns={studentColumns}
          data={students as (StudentResponse & Record<string, unknown>)[]}
          loading={loading}
          error={error}
          onRetry={refetch}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSort}
          emptyMessage={
            hasFilters
              ? "No students match these filters."
              : "No students yet. Add one, or import a CSV to add many at once."
          }
        />
        <EnterprisePagination
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemName="students"
        />
      </div>

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        entityType="students"
        onSuccess={() => void refetch()}
      />
    </div>
  );
}
