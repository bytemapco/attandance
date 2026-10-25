"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import { designationSchema, type DesignationFormData } from "@/lib/validations/masterData";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";

export default function CreateDesignationPage(): React.ReactElement {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DesignationFormData>({
    resolver: zodResolver(designationSchema),
    defaultValues: {
      name: "",
      code: "",
    },
  });

  async function onSubmit(formData: DesignationFormData): Promise<void> {
    try {
      await api.post("/admin/designations", {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
      });
      toast.success("Designation created successfully");
      router.push("/admin/setup/designations");
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
          { label: "Designations", href: "/admin/setup/designations" },
          { label: "Create" },
        ]}
      />
      <GlassPageHeader title="Create Designation" />
      <GlassCard className="max-w-xl">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <GlassInput
            label="Designation Name"
            placeholder="e.g. Associate Professor"
            {...register("name")}
            error={errors.name?.message}
          />
          <GlassInput
            label="Designation Code"
            placeholder="e.g. ASSOC_PROF"
            {...register("code")}
            error={errors.code?.message}
          />
          <div className="flex justify-end gap-3 pt-4">
            <GlassButton variant="ghost" type="button" onClick={() => router.back()}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" loading={isSubmitting}>
              Create Designation
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
