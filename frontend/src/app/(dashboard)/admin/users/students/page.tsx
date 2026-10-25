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
import { studentColumns } from "./StudentColumns";
import type { StudentResponse, DepartmentResponse, StudentFilterFacetsResponse } from "@/types";

export default function StudentsPage(): React.ReactElement {
  const router = useRouter();
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [facets, setFacets] = useState<StudentFilterFacetsResponse>({ branches: [], batches: [], semesters: [] });
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Filter States
  const [department, setDepartment] = useState<string>("all");
  const [semester, setSemester] = useState<string>("all");
  const [branch, setBranch] = useState<string>("all");
  const [batch, setBatch] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const extraParams = useMemo(() => ({
    department_id: department !== "all" ? department : undefined,
    semester: semester !== "all" ? Number(semester) : undefined,
    branch: branch !== "all" ? branch : undefined,
    batch: batch !== "all" ? batch : undefined,
    status: status !== "all" ? status : undefined,
  }), [department, semester, branch, batch, status]);

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

  useEffect(() => {
    async function loadMetadata(): Promise<void> {
      try {
        const [deptRes, facetRes] = await Promise.allSettled([
          api.get<DepartmentResponse[]>("/admin/departments"),
          api.get<StudentFilterFacetsResponse>("/admin/users/students/facets"),
        ]);
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

  const branchOptions = useMemo(() => {
    const set = new Set<string>(facets.branches);
    students.forEach((s) => {
      if (s.branch && s.branch.trim()) set.add(s.branch.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b)).map((b) => ({ value: b, label: b }));
  }, [facets.branches, students]);

  const batchOptions = useMemo(() => {
    const set = new Set<string>(facets.batches);
    students.forEach((s) => {
      if (s.batch && s.batch.trim()) set.add(s.batch.trim());
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a)).map((b) => ({ value: b, label: b }));
  }, [facets.batches, students]);

  const semesterOptions = useMemo(() => {
    const set = new Set<number>(facets.semesters);
    students.forEach((s) => {
      if (s.semester && s.semester > 0) set.add(s.semester);
    });
    const list = Array.from(set).sort((a, b) => a - b);
    if (list.length === 0) {
      return Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }));
    }
    return list.map((s) => ({ value: String(s), label: `Semester ${s}` }));
  }, [facets.semesters, students]);

  const handleResetAll = (): void => {
    setSearchQuery("");
    setDepartment("all");
    setSemester("all");
    setBranch("all");
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
      id: "branch",
      label: "Branch",
      options: branchOptions,
      value: branch,
      onChange: (val) => { setBranch(val); setCurrentPage(1); },
    },
    {
      id: "batch",
      label: "Batch",
      options: batchOptions,
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
    <div className="space-y-4 animate-fade-in-up">
      <GlassBreadcrumb items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Users" }, { label: "Students" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/60">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Students</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-secondary transition-colors shadow-2xs cursor-pointer"
          >
            <Upload size={13} /> Bulk Import
          </button>
          <button
            onClick={() => router.push("/admin/users/students/add")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus size={14} /> Add Student
          </button>
        </div>
      </div>

      <EnterpriseTableToolbar
        searchPlaceholder="Search by name, email, login ID..."
        searchValue={searchQuery}
        onSearch={setSearchQuery}
        filters={toolbarFilters}
        onResetAll={handleResetAll}
      />

      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        <GlassTable
          columns={studentColumns}
          data={students as (StudentResponse & Record<string, unknown>)[]}
          loading={loading}
          error={error}
          onRetry={refetch}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSort}
          emptyMessage="No students found"
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
