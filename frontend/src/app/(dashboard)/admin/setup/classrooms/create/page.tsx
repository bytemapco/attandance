"use client";

import React from "react";
import { useRouter } from "next/navigation";
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

export default function CreateClassroomPage(): React.ReactElement {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClassroomFormData>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(formData: ClassroomFormData): Promise<void> {
    try {
      await api.post("/admin/classrooms", {
        name: formData.name.trim(),
      });
      toast.success("Classroom created successfully");
      router.push("/admin/setup/classrooms");
    } catch (err: unknown) {
      const handled = applyValidationErrorsToForm(err, setError);
      if (!handled) {
        toast.error(getApiErrorMessage(err, "Creation failed"));
      }
    }
  }

  return (
    <div className="animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Setup" },
          { label: "Classrooms", href: "/admin/setup/classrooms" },
          { label: "Create" },
        ]}
      />
      <GlassPageHeader title="Create Classroom" />
      <GlassCard className="max-w-xl">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <GlassInput
            label="Classroom Name / Room Number"
            placeholder="e.g. Room 301, Lab B"
            {...register("name")}
            error={errors.name?.message}
          />
          <div className="flex justify-end gap-3 pt-4">
            <GlassButton variant="ghost" type="button" onClick={() => router.back()}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" loading={isSubmitting}>
              Create Classroom
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
