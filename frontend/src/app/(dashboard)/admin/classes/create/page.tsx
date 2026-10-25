"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, PlusCircle, X, Settings2 } from "lucide-react";
import toast from "react-hot-toast";

import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import { classFormSchema, type ClassFormData } from "@/lib/validations/admin";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassButton from "@/components/ui/GlassButton";
import type { TeacherResponse, SubjectResponse, ClassroomResponse } from "@/types";

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

export default function CreateClassPage(): React.ReactElement {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomResponse[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: "",
      subject_id: "",
      teacher_id: "",
      classroom_id: "",
      batch: "",
    },
  });

  useEffect(() => {
    async function fetchMasterData(): Promise<void> {
      try {
        const [teachersRes, subjectsRes, classroomsRes] = await Promise.all([
          api.get<TeacherResponse[] | { items?: TeacherResponse[] }>("/admin/users/teachers?page_size=100"),
          api.get<SubjectResponse[]>("/admin/subjects"),
          api.get<ClassroomResponse[]>("/admin/classrooms"),
        ]);
        const teacherList = Array.isArray(teachersRes.data)
          ? teachersRes.data
          : teachersRes.data?.items || [];
        setTeachers(teacherList);
        setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
        setClassrooms(Array.isArray(classroomsRes.data) ? classroomsRes.data : []);
      } catch {
        toast.error("Could not load master data.");
      }
    }
    void fetchMasterData();
  }, []);

  async function onSubmit(formData: ClassFormData): Promise<void> {
    try {
      await api.post("/admin/classes", {
        name: formData.name.trim(),
        subject_id: formData.subject_id,
        teacher_id: formData.teacher_id,
        classroom_id: formData.classroom_id || undefined,
        semester: formData.semester ? Number(formData.semester) : undefined,
        batch: formData.batch ? formData.batch.trim() : undefined,
      });
      toast.success("Class created successfully");
      router.push("/admin/classes");
    } catch (err: unknown) {
      const handled = applyValidationErrorsToForm(err, setError);
      if (!handled) {
        toast.error(getApiErrorMessage(err, "Failed to create class"));
      }
    }
  }

  const teacherOptions = [
    { value: "", label: "— Select Teacher —" },
    ...teachers.map((t) => ({
      value: t.id,
      label: `${t.first_name || ""} ${t.last_name || ""} (${t.email})${t.department ? ` — ${t.department}` : ""}`.trim(),
    })),
  ];
  const subjectOptions = [
    { value: "", label: "— Select Subject —" },
    ...subjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
  ];
  const classroomOptions = [
    { value: "", label: "None — no classroom" },
    ...classrooms.map((c) => ({ value: c.id, label: c.building ? `${c.name} — ${c.building}` : c.name })),
  ];

  return (
    <div className="space-y-6">
      <GlassBreadcrumb items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Classes", href: "/admin/classes" }, { label: "Create" }]} />
      <GlassPageHeader title="Create Class" description="Set up a new academic class with linked faculty and room" />

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-5">
            <GlassCard padding="md" className="bg-card">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Core Info</h3>
              </div>
              <GlassInput
                label="Class Name"
                placeholder="e.g. CS-101-A"
                {...register("name")}
                error={errors.name?.message}
              />
            </GlassCard>
          </div>

          <div className="lg:col-span-2">
            <GlassCard padding="md" className="bg-card h-full">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Class Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Controller
                    control={control}
                    name="teacher_id"
                    render={({ field }) => (
                      <GlassSelect
                        label="Teacher"
                        options={teacherOptions}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.teacher_id?.message}
                      />
                    )}
                  />
                </div>
                <Controller
                  control={control}
                  name="subject_id"
                  render={({ field }) => (
                    <GlassSelect
                      label="Subject"
                      options={subjectOptions}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.subject_id?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="classroom_id"
                  render={({ field }) => (
                    <GlassSelect
                      label="Classroom (optional)"
                      options={classroomOptions}
                      value={field.value ?? ""}
                      onChange={(v) => field.onChange(v || undefined)}
                      error={errors.classroom_id?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="semester"
                  render={({ field }) => (
                    <GlassSelect
                      label="Semester"
                      options={[{ value: "", label: "— Select —" }, ...SEMESTER_OPTIONS]}
                      value={field.value ? String(field.value) : ""}
                      onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                      error={errors.semester?.message}
                    />
                  )}
                />
                <GlassInput
                  label="Batch"
                  placeholder="e.g. 2022-2026"
                  {...register("batch")}
                  error={errors.batch?.message}
                />
              </div>
            </GlassCard>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <GlassButton variant="ghost" type="button" onClick={() => router.back()} icon={<X size={14} />}>
            Cancel
          </GlassButton>
          <GlassButton variant="primary" type="submit" loading={isSubmitting} icon={<PlusCircle size={14} />}>
            Create Class
          </GlassButton>
        </div>
      </form>
    </div>
  );
}
