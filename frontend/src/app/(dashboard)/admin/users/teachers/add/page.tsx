"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, PlusCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import TeacherFormProfile from "./TeacherFormProfile";
import { teacherFormSchema, TeacherFormData } from "@/lib/validations/teacher";
import type { DepartmentResponse, DesignationResponse } from "@/types";

export default function AddTeacherPage(): React.ReactElement {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [designations, setDesignations] = useState<DesignationResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      email: "",
      employee_id: "",
      first_name: "",
      last_name: "",
      department_id: "",
      designation_id: "",
      phone: "",
      send_invite: true,
    },
  });

  useEffect(() => {
    async function fetchMasterData(): Promise<void> {
      try {
        const [deptsRes, desigRes] = await Promise.all([
          api.get<DepartmentResponse[]>("/admin/departments"),
          api.get<DesignationResponse[]>("/admin/designations"),
        ]);
        setDepartments(deptsRes.data);
        setDesignations(desigRes.data);
      } catch {
        toast.error("Could not load departments/designations.");
      }
    }
    void fetchMasterData();
  }, []);

  async function onSubmit(formData: TeacherFormData): Promise<void> {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        phone: formData.phone || undefined,
      };
      await api.post("/admin/users/teacher", payload);
      toast.success("Teacher created and temporary password sent via email");
      router.push("/admin/users/teachers");
    } catch (err: unknown) {
      applyValidationErrorsToForm(err, setError);
      toast.error(getApiErrorMessage(err, "Failed to create teacher"));
    } finally {
      setLoading(false);
    }
  }

  const deptOptions = [
    { value: "", label: "— Select Department —" },
    ...departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
  ];

  const desigOptions = [
    { value: "", label: "— Select Designation —" },
    ...designations.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
  ];

  return (
    <div className="animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Teachers", href: "/admin/users/teachers" },
          { label: "Add New" },
        ]}
      />
      <GlassPageHeader
        title="Add Teacher"
        description="Create a new teacher account with FK-linked department and designation"
      />

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <GlassCard className="!p-0 overflow-hidden">
              <div className="p-5 border-b border-border bg-muted/40">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  Account Info
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Core system credentials.</p>
              </div>
              <div className="p-5 space-y-4">
                <GlassInput
                  label="Email Address"
                  type="email"
                  placeholder="teacher@university.edu"
                  {...register("email")}
                  error={errors.email?.message}
                />
                <GlassInput
                  label="Employee ID"
                  placeholder="e.g. EMP2024001"
                  {...register("employee_id")}
                  error={errors.employee_id?.message}
                />
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/60 text-xs text-blue-800 leading-relaxed">
                  🔒 A secure temporary password will be automatically generated and emailed to this teacher. They will be prompted to choose a new password upon first login.
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-2">
            <TeacherFormProfile
              register={register}
              control={control}
              errors={errors}
              deptOptions={deptOptions}
              desigOptions={desigOptions}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 pb-12">
          <GlassButton variant="ghost" type="button" onClick={() => router.back()} icon={<X size={16} />}>
            Cancel
          </GlassButton>
          <GlassButton variant="primary" type="submit" loading={loading} icon={<PlusCircle size={16} />}>
            Create Teacher
          </GlassButton>
        </div>
      </form>
    </div>
  );
}
