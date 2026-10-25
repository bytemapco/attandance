"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import {
  tenantProvisionSchema,
  type TenantProvisionFormData,
} from "@/lib/validations/superAdmin";
import { superAdminService } from "@/lib/services/superAdminService";
import { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassButton from "@/components/ui/GlassButton";
import ProvisionBasicInfoCard from "@/components/super-admin/ProvisionBasicInfoCard";
import ProvisionAdminAccountsCard from "@/components/super-admin/ProvisionAdminAccountsCard";

export default function ProvisionTenantPage(): React.ReactElement {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TenantProvisionFormData>({
    resolver: zodResolver(tenantProvisionSchema),
    defaultValues: {
      name: "",
      slug: "",
      type: "COLLEGE",
      domain: "",
      license_count: 0,
      admins: [
        {
          name: "",
          email: "",
          role: "TENANT_ADMIN",
        },
      ],
    },
  });

  const fieldArray = useFieldArray({
    control,
    name: "admins",
  });

  const handleNameChange = (val: string): void => {
    setValue("name", val, { shouldValidate: true });
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", autoSlug, { shouldValidate: true });
  };

  const onSubmit = async (formData: TenantProvisionFormData): Promise<void> => {
    try {
      const newTenant = await superAdminService.provisionTenant({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        type: formData.type,
        domain: formData.domain ? formData.domain.trim() : undefined,
        license_count: formData.license_count,
        admins: formData.admins.map((admin) => ({
          name: admin.name.trim(),
          email: admin.email.trim().toLowerCase(),
          role: "TENANT_ADMIN",
        })),
      });

      toast.success(
        `"${newTenant.name}" registered successfully with ${formData.admins.length} administrator(s)`
      );
      router.push("/super-admin/tenants");
    } catch (err: unknown) {
      const handled = applyValidationErrorsToForm(err, setError);
      if (!handled) {
        toast.error(getApiErrorMessage(err, "Failed to register institution"));
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Super Admin", href: "/super-admin/dashboard" },
          { label: "Institutions", href: "/super-admin/tenants" },
          { label: "Add New Institution" },
        ]}
      />

      <GlassPageHeader
        title="Add New Institution"
        description="Set up a school or college with student limits and administrator accounts."
      />

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <ProvisionBasicInfoCard
          register={register}
          errors={errors}
          control={control}
          onNameChange={handleNameChange}
        />

        <ProvisionAdminAccountsCard
          register={register}
          errors={errors}
          fieldArray={fieldArray}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <GlassButton
            type="button"
            variant="ghost"
            onClick={() => router.push("/super-admin/tenants")}
            disabled={isSubmitting}
          >
            Cancel
          </GlassButton>
          <GlassButton type="submit" variant="primary" loading={isSubmitting}>
            Save & Create Institution
          </GlassButton>
        </div>
      </form>
    </div>
  );
}
