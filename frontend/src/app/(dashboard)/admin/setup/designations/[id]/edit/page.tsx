"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import GlassLoader from "@/components/ui/GlassLoader";
import type { DesignationResponse } from "@/types";

export default function EditDesignationPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [desig, setDesig] = useState<DesignationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DesignationFormData>({
    resolver: zodResolver(designationSchema),
  });

  useEffect(() => {
    async function fetch(): Promise<void> {
      try {
        const { data } = await api.get<DesignationResponse>(`/admin/designations/${id}`);
        setDesig(data);
        reset({
          name: data.name,
          code: data.code,
        });
      } catch {
        toast.error("Failed to load designation");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id, reset]);

  async function onSubmit(formData: DesignationFormData): Promise<void> {
    try {
      await api.put(`/admin/designations/${id}`, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
      });
      toast.success("Designation updated successfully");
      router.push("/admin/setup/designations");
    } catch (err: unknown) {
      const handled = applyValidationErrorsToForm(err, setError);
      if (!handled) {
        toast.error(getApiErrorMessage(err, "Update failed"));
      }
    }
  }

  if (loading) return <GlassLoader />;
  if (!desig) return <div className="text-center py-20 text-slate-500">Designation not found</div>;

  return (
    <div className="animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Setup" },
          { label: "Designations", href: "/admin/setup/designations" },
          { label: desig.name },
          { label: "Edit" },
        ]}
      />
      <GlassPageHeader title="Edit Designation" />
      <GlassCard className="max-w-xl">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <GlassInput
            label="Designation Name"
            {...register("name")}
            error={errors.name?.message}
          />
          <GlassInput
            label="Designation Code"
            {...register("code")}
            error={errors.code?.message}
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
