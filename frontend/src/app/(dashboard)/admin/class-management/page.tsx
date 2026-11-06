"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, AlertCircle, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import useSWR from "swr";

import { getApiErrorMessage } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useDepartments } from "@/hooks/useReferenceData";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Button from "@/components/ui/Button";
import DataTable, { type TableColumn } from "@/components/ui/DataTable";
import TableToolbar, { type ToolbarFilterConfig } from "@/components/ui/TableToolbar";
import type { ClassSummary } from "@/types";

type ClassRow = ClassSummary & Record<string, unknown>;

const NO_CLASSES: ClassRow[] = [];

const SEMESTER_FILTER = [
  { value: "all", label: "All semesters" },
  ...Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` })),
];

export default function ClassManagementPage(): React.ReactElement {
  const router = useRouter();
  const { items: departments, failed: departmentsFailed } = useDepartments();
  const [departmentId, setDepartmentId] = useState("all");
  const [semester, setSemester] = useState("all");
  const [search, setSearch] = useState("");
  const typedSearch = useDebounce(search, 350);

  const { data, error: loadError, isLoading: loading, mutate } = useSWR<ClassRow[]>([
    "/admin/class-management/classes",
    {
      department_id: departmentId && departmentId !== "all" ? departmentId : undefined,
      semester_number: semester && semester !== "all" ? Number(semester) : undefined,
      search: typedSearch.trim() || undefined,
    },
  ]);
  const classes = data ?? NO_CLASSES;
  const error = loadError ? getApiErrorMessage(loadError, "Failed to load classes") : null;

  useEffect(() => {
    if (departmentsFailed) toast.error("Failed to load filters");
  }, [departmentsFailed]);

  const hasFilters = search.trim() !== "" || departmentId !== "all" || semester !== "all";

  const handleResetAll = (): void => {
    setSearch("");
    setDepartmentId("all");
    setSemester("all");
  };

  const toolbarFilters: ToolbarFilterConfig[] = useMemo(() => [
    {
      id: "department",
      label: "Department",
      options: [{ value: "all", label: "All departments" }, ...departments.map((d) => ({ value: d.id, label: d.name }))],
      value: departmentId,
      onChange: setDepartmentId,
    },
    {
      id: "semester",
      label: "Semester",
      options: SEMESTER_FILTER,
      value: semester,
      onChange: setSemester,
    },
  ], [departments, departmentId, semester]);

  const columns: TableColumn<ClassRow>[] = useMemo(() => [
    {
      key: "code",
      header: "Class",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground text-sm">{row.code}</span>
          <span className="inline-block text-xs font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-sm border border-border/60">
            Sem {row.semester_number}
          </span>
          {row.status !== "ACTIVE" && (
            <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm border border-border">
              {row.status}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "department_name",
      header: "Department",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-foreground font-medium">{row.department_name}</span>
      ),
    },
    {
      key: "member_count",
      header: "Students",
      sortable: true,
      render: (row) => (
        <span className="text-sm font-semibold text-foreground">{row.member_count}</span>
      ),
    },
    {
      key: "subject_count",
      header: "Subjects",
      sortable: true,
      render: (row) => {
        if (row.subject_count > 0) {
          return (
            <span className="text-sm font-semibold text-foreground">{row.subject_count}</span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-warning-soft border border-warning-border/80 px-2 py-0.5 rounded-full">
            <AlertCircle size={11} /> Needs setup
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/class-management/${row.id}`);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:border-muted-foreground bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all cursor-pointer"
          >
            Manage
            <ChevronRight size={13} className="text-muted-foreground" />
          </button>
        </div>
      ),
    },
  ], [router]);

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Classes" }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Classes</h1>
          <span className="text-xs font-medium text-muted-foreground">({classes.length} total)</span>
        </div>
        <Button 
          variant="primary" 
          size="md"
          icon={<Plus size={15} />} 
          onClick={() => router.push("/admin/class-management/create")}
        >
          Create Class
        </Button>
      </div>

      {/* Filter Toolbar */}
      <TableToolbar
        searchPlaceholder="Search by class code or department..."
        searchValue={search}
        onSearch={setSearch}
        filters={toolbarFilters}
        onResetAll={handleResetAll}
      />

      {/* Clean Structured Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <DataTable
          columns={columns}
          data={classes}
          loading={loading}
          error={error}
          onRetry={() => void mutate()}
          emptyMessage={
            hasFilters
              ? "No classes match these filters."
              : "No classes yet. Create a class, then add its students, subjects and weekly schedule."
          }
          onRowClick={(row) => router.push(`/admin/class-management/${row.id}`)}
          rowKey={(row) => row.id}
        />
      </div>
    </div>
  );
}
