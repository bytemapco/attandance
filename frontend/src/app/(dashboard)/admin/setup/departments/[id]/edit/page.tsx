"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import { departmentSchema, type DepartmentFormData } from "@/lib/validations/masterData";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import type { DepartmentResponse } from "@/types";

export default function EditDepartmentPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dept, setDept] = useState<DepartmentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
  });

  useEffect(() => {
    async function fetch(): Promise<void> {
      try {
        const { data } = await api.get<DepartmentResponse>(`/admin/departments/${id}`);
        setDept(data);
        reset({
          name: data.name,
          code: data.code,
        });
      } catch {
        toast.error("Failed to load department");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id, reset]);

  async function onSubmit(formData: DepartmentFormData): Promise<void> {
    try {
      await api.put(`/admin/departments/${id}`, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
      });
      toast.success("Department updated successfully");
      router.push("/admin/setup/departments");
    } catch (err: unknown) {
      const handled = applyValidationErrorsToForm(err, setError);
      if (!handled) {
        toast.error(getApiErrorMessage(err, "Update failed"));
      }
    }
  }

  if (loading) return <GlassLoader />;
  if (!dept) return <div className="text-center py-20 text-slate-500">Department not found</div>;

  return (
    <div className="animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Setup" },
          { label: "Departments", href: "/admin/setup/departments" },
          { label: dept.name },
          { label: "Edit" },
        ]}
      />
      <GlassPageHeader title="Edit Department" />
      <GlassCard className="max-w-xl">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <GlassInput
            label="Department Name"
            {...register("name")}
            error={errors.name?.message}
          />
          <GlassInput
            label="Code"
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
