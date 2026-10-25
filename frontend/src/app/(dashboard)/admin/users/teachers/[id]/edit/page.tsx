"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Briefcase, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import EditTeacherFormFields from "./EditTeacherFormFields";
import { teacherUpdateSchema, TeacherUpdateFormData } from "@/lib/validations/teacher";
import type { TeacherResponse, DepartmentResponse, DesignationResponse } from "@/types";

export default function EditTeacherPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [teacher, setTeacher] = useState<TeacherResponse | null>(null);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [designations, setDesignations] = useState<DesignationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TeacherUpdateFormData>({
    resolver: zodResolver(teacherUpdateSchema),
    defaultValues: {
      employee_id: "",
      first_name: "",
      last_name: "",
      department_id: "",
      designation_id: "",
      phone: "",
    },
  });

  useEffect(() => {
    async function fetchData(): Promise<void> {
      try {
        const [teacherRes, depsRes, desigsRes] = await Promise.all([
          api.get<TeacherResponse>(`/admin/users/teachers/${id}`),
          api.get<DepartmentResponse[]>("/admin/departments").catch(() => ({ data: [] })),
          api.get<DesignationResponse[]>("/admin/designations").catch(() => ({ data: [] })),
        ]);
        setDepartments(depsRes.data);
        setDesignations(desigsRes.data);
        
        const found = teacherRes.data;
        if (found) {
          setTeacher(found);
          reset({
            employee_id: found.employee_id,
            first_name: found.first_name,
            last_name: found.last_name,
            phone: found.phone ?? "",
            department_id: found.department_id,
            designation_id: found.designation_id,
          });
        }
      } catch {
        toast.error("Failed to load teacher data");
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [id, reset]);

  async function onSubmit(formData: TeacherUpdateFormData): Promise<void> {
    setSaving(true);
    try {
      await api.put(`/admin/users/teachers/${id}`, {
        employee_id: formData.employee_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
        department_id: formData.department_id,
        designation_id: formData.designation_id,
      });
      toast.success("Teacher updated successfully");
      router.push(`/admin/users/teachers/${id}`);
    } catch (err: unknown) {
      applyValidationErrorsToForm(err, setError);
      toast.error(getApiErrorMessage(err, "Update failed"));
    } finally {
      setSaving(false);
    }
  }

  const deptOptions = departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }));
  const desigOptions = designations.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }));

  if (loading) return <GlassLoader text="Loading teacher..." />;
  if (!teacher) return <div className="text-center py-20 text-slate-500">Teacher not found</div>;

  return (
    <div className="animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Teachers", href: "/admin/users/teachers" },
          { label: teacher.email, href: `/admin/users/teachers/${id}` },
          { label: "Edit" },
        ]}
      />
      <GlassPageHeader title="Edit Teacher Profile" description="Update teacher personal and academic details." />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <GlassCard className="!p-0 overflow-hidden">
              <div className="p-5 border-b border-border bg-muted/40">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  Account Info
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Core system identifiers.</p>
              </div>
              <div className="p-5 space-y-4">
                <GlassInput label="Email Address" value={teacher.email} disabled />
                <GlassInput
                  label="Employee ID *"
                  {...register("employee_id")}
                  error={errors.employee_id?.message}
                />
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-2">
            <GlassCard className="!p-0 overflow-hidden h-full">
              <div className="p-5 border-b border-border bg-muted/40">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Briefcase size={18} className="text-primary" />
                  Professional Profile
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Personal and academic details.</p>
              </div>
              <EditTeacherFormFields
                register={register}
                control={control}
                errors={errors}
                deptOptions={deptOptions}
                desigOptions={desigOptions}
              />
            </GlassCard>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 pb-12">
          <GlassButton variant="ghost" type="button" onClick={() => router.back()} icon={<X size={16} />}>
            Cancel
          </GlassButton>
          <GlassButton variant="primary" type="submit" loading={saving} icon={<Save size={16} />}>
            Save Changes
          </GlassButton>
        </div>
      </form>
    </div>
  );
}
