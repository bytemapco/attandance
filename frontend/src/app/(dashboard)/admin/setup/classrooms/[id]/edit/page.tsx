"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import { classroomSchema, type ClassroomFormData } from "@/lib/validations/masterData";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import type { ClassroomResponse } from "@/types";

export default function EditClassroomPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [classroom, setClassroom] = useState<ClassroomResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClassroomFormData>({
    resolver: zodResolver(classroomSchema),
  });

  useEffect(() => {
    async function fetch(): Promise<void> {
      try {
        const { data } = await api.get<ClassroomResponse>(`/admin/classrooms/${id}`);
        setClassroom(data);
        reset({
          name: data.name,
        });
      } catch {
        toast.error("Failed to load classroom");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id, reset]);

  async function onSubmit(formData: ClassroomFormData): Promise<void> {
    try {
      await api.put(`/admin/classrooms/${id}`, {
        name: formData.name.trim(),
      });
      toast.success("Classroom updated successfully");
      router.push("/admin/setup/classrooms");
    } catch (err: unknown) {
      const handled = applyValidationErrorsToForm(err, setError);
      if (!handled) {
        toast.error(getApiErrorMessage(err, "Update failed"));
      }
    }
  }

  if (loading) return <GlassLoader />;
  if (!classroom) return <div className="text-center py-20 text-slate-500">Classroom not found</div>;

  return (
    <div className="animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Setup" },
          { label: "Classrooms", href: "/admin/setup/classrooms" },
          { label: classroom.name },
          { label: "Edit" },
        ]}
      />
      <GlassPageHeader title="Edit Classroom" />
      <GlassCard className="max-w-xl">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <GlassInput
            label="Classroom Name / Room Number"
            {...register("name")}
            error={errors.name?.message}
          />
          <div className="flex justify-end gap-3 pt-4">
            <GlassButton variant="ghost" type="button" onClick={() => router.back()}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" loading={isSubmitting}>
              Save Changes
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
