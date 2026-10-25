"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import { subjectSchema, type SubjectFormData } from "@/lib/validations/masterData";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";

export default function CreateSubjectPage(): React.ReactElement {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      code: "",
    },
  });

  async function onSubmit(formData: SubjectFormData): Promise<void> {
    try {
      await api.post("/admin/subjects", {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
      });
      toast.success("Subject created successfully");
      router.push("/admin/setup/subjects");
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
          { label: "Subjects", href: "/admin/setup/subjects" },
          { label: "Create" },
        ]}
      />
      <GlassPageHeader title="Create Subject" />
      <GlassCard className="max-w-xl">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <GlassInput
            label="Subject Name"
            placeholder="e.g. Machine Learning"
            {...register("name")}
            error={errors.name?.message}
          />
          <GlassInput
            label="Subject Code"
            placeholder="e.g. CS-402"
            {...register("code")}
            error={errors.code?.message}
          />
          <div className="flex justify-end gap-3 pt-4">
            <GlassButton variant="ghost" type="button" onClick={() => router.back()}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" loading={isSubmitting}>
              Create Subject
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
