"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

import api, { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassButton from "@/components/ui/GlassButton";
import GlassSearch from "@/components/ui/GlassSearch";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassTable, { type TableColumn } from "@/components/ui/GlassTable";
import type { AcademicYearItem, ClassSummary, DepartmentResponse } from "@/types";

type ClassRow = ClassSummary & Record<string, unknown>;

const SEMESTER_FILTER = [
  { value: "", label: "All semesters" },
  ...Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` })),
];

const COLUMNS: TableColumn<ClassRow>[] = [
  { key: "code", header: "Class", sortable: true, render: (row) => <span className="font-semibold">{row.code}</span> },
  { key: "department_name", header: "Department", sortable: true },
  { key: "semester_number", header: "Semester", sortable: true, render: (row) => `Sem ${row.semester_number}` },
  { key: "academic_year_name", header: "Term" },
  { key: "member_count", header: "Students", sortable: true },
  { key: "subject_count", header: "Subjects", sortable: true },
  {
    key: "status",
    header: "Status",
    render: (row) => <GlassBadge variant={row.status === "ACTIVE" ? "success" : "neutral"}>{row.status}</GlassBadge>,
  },
];

export default function ClassManagementPage(): React.ReactElement {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [years, setYears] = useState<AcademicYearItem[]>([]);
  const [departmentId, setDepartmentId] = useState("");
  const [yearId, setYearId] = useState("");
  const [semester, setSemester] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFilters(): Promise<void> {
      try {
        const [deptRes, yearRes] = await Promise.all([
          api.get<DepartmentResponse[]>("/admin/departments"),
          api.get<AcademicYearItem[]>("/admin/academic-years"),
        ]);
        setDepartments(deptRes.data);
        setYears(yearRes.data);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load filters"));
      }
    }
    void loadFilters();
  }, []);

  const fetchClasses = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<ClassSummary[]>("/admin/class-management/classes", {
        params: {
          department_id: departmentId || undefined,
          academic_year_id: yearId || undefined,
          semester_number: semester || undefined,
          search: search.trim() || undefined,
        },
      });
      setClasses(data as ClassRow[]);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load classes"));
    } finally {
      setLoading(false);
    }
  }, [departmentId, yearId, semester, search]);

  useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  return (
    <div className="animate-fade-in-up space-y-4">
      <GlassBreadcrumb items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Classes" }]} />
      <GlassPageHeader
        title="Classes"
        description="Divisions per department and semester, with students, lab batches and subjects."
        actions={
          <GlassButton variant="primary" icon={<Plus size={16} />} onClick={() => router.push("/admin/class-management/create")}>
            Create Class
          </GlassButton>
        }
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <GlassSearch placeholder="Search by class code, e.g. CE-A" onSearch={setSearch} />
        <GlassSelect
          value={departmentId}
          onChange={setDepartmentId}
          placeholder="All departments"
          options={[{ value: "", label: "All departments" }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
        />
        <GlassSelect
          value={yearId}
          onChange={setYearId}
          placeholder="All terms"
          options={[{ value: "", label: "All terms" }, ...years.map((y) => ({ value: y.id, label: y.name }))]}
        />
        <GlassSelect value={semester} onChange={setSemester} placeholder="All semesters" options={SEMESTER_FILTER} />
      </div>
      <GlassTable
        columns={COLUMNS}
        data={classes}
        loading={loading}
        error={error}
        onRetry={() => void fetchClasses()}
        emptyMessage="No classes yet. Create the first class to get started."
        onRowClick={(row) => router.push(`/admin/class-management/${row.id}`)}
        rowKey={(row) => row.id}
      />
    </div>
  );
}
