"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import { assignTeacherSchema, type AssignTeacherFormData } from "@/lib/validations/admin";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import type { TeacherResponse } from "@/types";

export default function AssignTeacherPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AssignTeacherFormData>({
    resolver: zodResolver(assignTeacherSchema),
    defaultValues: {
      teacher_id: "",
    },
  });

  useEffect(() => {
    async function fetch(): Promise<void> {
      try {
        const { data } = await api.get<TeacherResponse[] | { items?: TeacherResponse[] }>(
          "/admin/users/teachers?page_size=100"
        );
        const list = Array.isArray(data) ? data : data?.items || [];
        setTeachers(list);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load teachers"));
      } finally {
        setLoading(false);
      }
    }
    void fetch();
  }, []);

  async function onSubmit(formData: AssignTeacherFormData): Promise<void> {
    try {
      await api.put(`/admin/classes/${id}/assign-teacher`, { teacher_id: formData.teacher_id });
      toast.success("Teacher assigned successfully");
      router.push(`/admin/classes/${id}`);
    } catch (err: unknown) {
      const handled = applyValidationErrorsToForm(err, setError);
      if (!handled) {
        toast.error(getApiErrorMessage(err, "Assignment failed"));
      }
    }
  }

  if (loading) return <GlassLoader />;

  return (
    <div className="animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Classes", href: "/admin/classes" },
          { label: "Class", href: `/admin/classes/${id}` },
          { label: "Assign Teacher" },
        ]}
      />
      <GlassPageHeader title="Assign Teacher" description="Select a teacher to manage this class" />
      <GlassCard className="max-w-xl">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Controller
            control={control}
            name="teacher_id"
            render={({ field }) => (
              <GlassSelect
                label="Teacher"
                options={teachers.map((t) => ({
                  value: t.id,
                  label: `${t.first_name || ""} ${t.last_name || ""} (${t.email})${t.department ? ` — ${t.department}` : ""}`.trim(),
                }))}
                value={field.value}
                onChange={field.onChange}
                error={errors.teacher_id?.message}
                placeholder="Select teacher..."
                searchable={true}
                searchPlaceholder="Search teacher by name, email, department..."
              />
            )}
          />
          <div className="flex justify-end gap-3 pt-4">
            <GlassButton variant="ghost" type="button" onClick={() => router.back()}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" loading={isSubmitting}>
              Assign Teacher
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
