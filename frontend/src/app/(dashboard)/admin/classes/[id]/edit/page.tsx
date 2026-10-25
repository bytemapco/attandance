"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Save, X, Settings2 } from "lucide-react";
import toast from "react-hot-toast";

import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import { classEditSchema, type ClassEditFormData } from "@/lib/validations/admin";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import type { ClassResponse, SubjectResponse, ClassroomResponse } from "@/types";

export default function EditClassPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cls, setCls] = useState<ClassResponse | null>(null);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClassEditFormData>({
    resolver: zodResolver(classEditSchema),
  });

  useEffect(() => {
    async function fetchData(): Promise<void> {
      try {
        const [classRes, subjectsRes, classroomsRes] = await Promise.all([
          api.get<ClassResponse>(`/admin/classes/${id}`),
          api.get<SubjectResponse[]>("/admin/subjects"),
          api.get<ClassroomResponse[]>("/admin/classrooms"),
        ]);
        const found = classRes.data;
        if (found) {
          setCls(found);
          const matchedSubject = subjectsRes.data.find(
            (s) => s.name === found.subject_name && s.code === found.subject_code
          );
          const matchedClassroom = classroomsRes.data.find((c) => c.name === found.classroom_name);
          reset({
            name: found.name,
            teacher_id: found.teacher_id || found.teacherId || "",
            subject_id: matchedSubject ? matchedSubject.id : "",
            classroom_id: matchedClassroom ? matchedClassroom.id : "",
            semester: found.semester ?? undefined,
            batch: found.batch || "",
          });
        }
        setSubjects(subjectsRes.data);
        setClassrooms(classroomsRes.data);
      } catch {
        toast.error("Could not load class data.");
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, [id, reset]);

  async function onSubmit(formData: ClassEditFormData): Promise<void> {
    try {
      await api.put(`/admin/classes/${id}`, {
        name: formData.name.trim(),
        subject_id: formData.subject_id || undefined,
        classroom_id: formData.classroom_id || undefined,
        semester: formData.semester,
        batch: formData.batch ? formData.batch.trim() : undefined,
      });
      toast.success("Class updated successfully");
      router.push(`/admin/classes/${id}`);
    } catch (err: unknown) {
      const handled = applyValidationErrorsToForm(err, setError);
      if (!handled) {
        toast.error(getApiErrorMessage(err, "Update failed"));
      }
    }
  }

  if (loading) return <GlassLoader />;
  if (!cls) return <div className="text-center py-20 text-muted-foreground text-xs">Class not found</div>;

  const subjectOptions = [
    { value: "", label: "— Select Subject —" },
    ...subjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
  ];
  const SEMESTER_OPTIONS = [
    { value: "", label: "— Select Semester —" },
    ...Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Semester ${i + 1}` })),
  ];
  const classroomOptions = [
    { value: "", label: "None — no classroom" },
    ...classrooms.map((c) => ({ value: c.id, label: c.building ? `${c.name} — ${c.building}` : c.name })),
  ];

  return (
    <div className="space-y-6">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Classes", href: "/admin/classes" },
          { label: cls.name, href: `/admin/classes/${id}` },
          { label: "Edit" },
        ]}
      />
      <GlassPageHeader title="Edit Class" description={`Configure parameters for ${cls.name}`} />
      
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
                {...register("name")}
                error={errors.name?.message}
              />
            </GlassCard>
          </div>

          <div className="lg:col-span-2">
            <GlassCard padding="md" className="bg-card h-full">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Class Configuration</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      label="Classroom"
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
                      options={SEMESTER_OPTIONS}
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
          <GlassButton variant="primary" type="submit" loading={isSubmitting} icon={<Save size={14} />}>
            Save Changes
          </GlassButton>
        </div>
      </form>
    </div>
  );
}
