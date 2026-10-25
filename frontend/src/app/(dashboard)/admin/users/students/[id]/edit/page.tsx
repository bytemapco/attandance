"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, GraduationCap, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import EditStudentFormFields from "./EditStudentFormFields";
import { studentUpdateSchema, StudentUpdateFormData } from "@/lib/validations/student";
import type { StudentResponse, DepartmentResponse } from "@/types";

export default function EditStudentPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<StudentResponse | null>(null);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<StudentUpdateFormData>({
    resolver: zodResolver(studentUpdateSchema),
    defaultValues: {
      enrollment_number: "",
      first_name: "",
      last_name: "",
      phone: "",
      gender: "",
      date_of_birth: "",
      semester: undefined,
      batch: "",
      department_id: "",
    },
  });

  useEffect(() => {
    async function fetchStudentAndDeps(): Promise<void> {
      try {
        const [studentRes, depsRes] = await Promise.all([
          api.get<StudentResponse>(`/admin/users/students/${id}`),
          api.get<DepartmentResponse[]>("/admin/departments").catch(() => ({ data: [] })),
        ]);
        setDepartments(depsRes.data);
        const found = studentRes.data;
        if (found) {
          setStudent(found);
          reset({
            enrollment_number: found.enrollment_number,
            first_name: found.first_name || "",
            last_name: found.last_name || "",
            phone: found.phone ?? "",
            gender: found.gender ?? "",
            branch: found.branch ?? "",
            date_of_birth: found.date_of_birth ? new Date(found.date_of_birth).toISOString().split("T")[0] : "",
            semester: found.semester ?? undefined,
            batch: found.batch ?? "",
            department_id: found.department_id ?? "",
          });
        }
      } catch {
        toast.error("Failed to load student data");
      } finally {
        setLoading(false);
      }
    }

    void fetchStudentAndDeps();
  }, [id, reset]);

  async function onSubmit(formData: StudentUpdateFormData): Promise<void> {
    setSaving(true);
    try {
      await api.put(`/admin/users/students/${id}`, {
        enrollment_number: formData.enrollment_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
        gender: formData.gender || undefined,
        branch: formData.branch || undefined,
        date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : undefined,
        semester: formData.semester !== undefined && formData.semester !== null ? Number(formData.semester) : undefined,
        batch: formData.batch || undefined,
        department_id: formData.department_id || undefined,
      });
      toast.success("Student updated successfully");
      router.push(`/admin/users/students/${id}`);
    } catch (err: unknown) {
      applyValidationErrorsToForm(err, setError);
      toast.error(getApiErrorMessage(err, "Update failed"));
    } finally {
      setSaving(false);
    }
  }

  const deptOptions = [
    { value: "", label: "None — assign later" },
    ...departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
  ];

  if (loading) return <GlassLoader text="Loading student..." />;
  if (!student) return <div className="text-center py-20 text-slate-500">Student not found</div>;

  return (
    <div className="animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Students", href: "/admin/users/students" },
          { label: student.email, href: `/admin/users/students/${id}` },
          { label: "Edit" },
        ]}
      />
      <GlassPageHeader title="Edit Student Profile" description="Update student personal and academic details." />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <GlassCard className="!p-0 overflow-hidden">
              <div className="p-5 border-b border-border bg-muted/40">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  Account Info
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Core system identifiers.</p>
              </div>
              <div className="p-5 space-y-4">
                <GlassInput label="Email Address" value={student.email} disabled />
                <GlassInput
                  label="Enrollment Number"
                  {...register("enrollment_number")}
                  error={errors.enrollment_number?.message}
                />
              </div>
            </GlassCard>
          </div>

          <div className="lg:col-span-2">
            <GlassCard className="!p-0 overflow-hidden h-full">
              <div className="p-5 border-b border-border bg-muted/40">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <GraduationCap size={18} className="text-primary" />
                  Student Profile
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Personal and academic details.</p>
              </div>
              <EditStudentFormFields
                register={register}
                control={control}
                errors={errors}
                deptOptions={deptOptions}
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
