"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import { formatAcademicYearName } from "@/lib/utils";
import { academicYearSchema, type AcademicYearFormData } from "@/lib/validations/masterData";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";

export default function CreateAcademicYearPage(): React.ReactElement {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AcademicYearFormData>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      name: "",
      start_date: "",
      end_date: "",
      saturday_enabled: false,
    },
  });

  const startDate = watch("start_date");
  const endDate = watch("end_date");

  useEffect(() => {
    setValue("name", formatAcademicYearName(startDate, endDate), { shouldValidate: true });
  }, [startDate, endDate, setValue]);

  async function onSubmit(formData: AcademicYearFormData): Promise<void> {
    try {
      await api.post("/admin/academic-years", {
        name: formData.name.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        saturday_enabled: formData.saturday_enabled,
      });
      toast.success("Academic year created successfully");
      router.push("/admin/master-data/academic-years");
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
          { label: "Master Data", href: "/admin/master-data/departments" },
          { label: "Academic Years", href: "/admin/master-data/academic-years" },
          { label: "Create" },
        ]}
      />
      <GlassPageHeader title="Create Academic Year" />
      <GlassCard className="max-w-xl">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <GlassInput
              label="Start Date"
              type="date"
              {...register("start_date")}
              error={errors.start_date?.message}
            />
            <GlassInput
              label="End Date"
              type="date"
              {...register("end_date")}
              error={errors.end_date?.message}
            />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-[#202b30] mb-1.5">Name</p>
            <p className="h-9 sm:h-10 flex items-center px-3 rounded-md border border-[#e3e1dc] bg-[#eeece7] text-sm text-[#526f78]">
              {watch("name") || "Select start and end dates"}
            </p>
            {errors.name && <p className="text-xs font-medium text-[#b54242] mt-0.5">{errors.name.message}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-[#202b30]">
            <input type="checkbox" className="h-4 w-4 rounded border-[#e3e1dc]" {...register("saturday_enabled")} />
            Saturday is an instructional day
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <GlassButton variant="ghost" type="button" onClick={() => router.back()}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" type="submit" loading={isSubmitting}>
              Create Academic Year
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
