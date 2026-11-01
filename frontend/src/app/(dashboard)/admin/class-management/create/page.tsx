"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import {
  classCreateSchema,
  studentsForClass,
  type ClassCreateFormData,
  type ClassCreateFormInput,
} from "@/lib/validations/classManagement";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassButton from "@/components/ui/GlassButton";
import { useDepartmentBatches } from "@/components/admin/batches/useDepartmentBatches";
import StudentSelectionList from "./StudentSelectionList";
import type { AcademicYearItem, ClassDetail, DepartmentResponse, StudentResponse } from "@/types";

const SEMESTERS = Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` }));

export default function CreateClassPage(): React.ReactElement {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [years, setYears] = useState<AcademicYearItem[]>([]);
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClassCreateFormInput, unknown, ClassCreateFormData>({
    resolver: zodResolver(classCreateSchema),
    defaultValues: { department_id: "", academic_year_id: "", semester_number: 1, batch_id: "" },
  });
  const departmentId = useWatch({ control, name: "department_id" });
  const semester = Number(useWatch({ control, name: "semester_number" }));
  const batchId = useWatch({ control, name: "batch_id" });
  const { batches } = useDepartmentBatches(departmentId || undefined);

  useEffect(() => {
    async function loadOptions(): Promise<void> {
      try {
        const [deptRes, yearRes, studentRes] = await Promise.all([
          api.get<DepartmentResponse[]>("/admin/departments"),
          api.get<AcademicYearItem[]>("/admin/academic-years"),
          api.get<StudentResponse[] | { items: StudentResponse[] }>("/admin/users/students?page_size=1000"),
        ]);
        setDepartments(deptRes.data);
        setYears(yearRes.data);
        setStudents(Array.isArray(studentRes.data) ? studentRes.data : studentRes.data.items ?? []);
        const active = yearRes.data.find((y) => y.status === "ACTIVE");
        if (active) setValue("academic_year_id", active.id);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load departments, terms and students"));
      }
    }
    void loadOptions();
  }, [setValue]);

  const matching = useMemo(
    () => (batchId ? studentsForClass(students, departmentId, semester, batchId) : []),
    [students, departmentId, semester, batchId]
  );

  useEffect(() => {
    setSelected(new Set(matching.map((s) => s.id)));
  }, [matching]);

  function toggle(studentId: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function toggleAll(): void {
    const everyoneSelected = matching.every((s) => selected.has(s.id));
    setSelected(everyoneSelected ? new Set() : new Set(matching.map((s) => s.id)));
  }

  async function onSubmit(formData: ClassCreateFormData): Promise<void> {
    try {
      const { data } = await api.post<ClassDetail>("/admin/class-management/classes", {
        ...formData,
        student_ids: Array.from(selected),
      });
      toast.success(`Class ${data.code} created with ${data.member_count} student(s)`);
      router.push(`/admin/class-management/${data.id}`);
    } catch (err: unknown) {
      const handled = applyValidationErrorsToForm(err, setError);
      if (!handled) toast.error(getApiErrorMessage(err, "Class creation failed"));
    }
  }

  return (
    <div className="animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Classes", href: "/admin/class-management" },
          { label: "Create" },
        ]}
      />
      <GlassPageHeader
        title="Create Class"
        description="Pick a department, semester and batch. Students of that batch are selected automatically."
      />
      <GlassCard className="max-w-xl">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Controller
            control={control}
            name="department_id"
            render={({ field }) => (
              <GlassSelect
                label="Department"
                placeholder="Select department"
                value={field.value}
                onChange={(value) => { field.onChange(value); setValue("batch_id", ""); }}
                options={departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))}
                error={errors.department_id?.message}
                searchable
              />
            )}
          />
          <Controller
            control={control}
            name="semester_number"
            render={({ field }) => (
              <GlassSelect
                label="Semester"
                value={String(field.value)}
                onChange={field.onChange}
                options={SEMESTERS}
                error={errors.semester_number?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="batch_id"
            render={({ field }) => (
              <GlassSelect
                label="Batch"
                placeholder={departmentId ? "Select batch" : "Select a department first"}
                value={field.value}
                onChange={field.onChange}
                options={batches.map((b) => ({ value: b.id, label: b.code }))}
                error={errors.batch_id?.message}
                disabled={!departmentId}
              />
            )}
          />
          {departmentId && batches.length === 0 && (
            <p className="text-xs text-[#8a5b12]">
              This department has no active batches yet. Add them under Setup → Departments.
            </p>
          )}
          {batchId && matching.length === 0 && (
            <p className="text-xs text-[#8a5b12]">No students in this batch for the selected semester.</p>
          )}
          <Controller
            control={control}
            name="academic_year_id"
            render={({ field }) => (
              <GlassSelect
                label="Academic Year / Term"
                placeholder="Select academic year"
                value={field.value}
                onChange={field.onChange}
                options={years.map((y) => ({ value: y.id, label: y.name }))}
                error={errors.academic_year_id?.message}
              />
            )}
          />
          {matching.length > 0 && (
            <StudentSelectionList students={matching} selected={selected} onToggle={toggle} onToggleAll={toggleAll} />
          )}
          <div className="flex justify-end gap-3 pt-4">
            <GlassButton variant="ghost" type="button" onClick={() => router.back()}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" loading={isSubmitting}>
              Create Class
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
