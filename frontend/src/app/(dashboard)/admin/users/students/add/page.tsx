"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, GraduationCap, PlusCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import StudentFormFields from "./StudentFormFields";
import { studentFormSchema, StudentFormData } from "@/lib/validations/student";
import type { DepartmentResponse } from "@/types";

export default function AddStudentPage(): React.ReactElement {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      email: "",
      enrollment_number: "",
      first_name: "",
      last_name: "",
      phone: "",
      gender: "",
      date_of_birth: "",
      branch: "",
      semester: undefined,
      batch: "",
      department_id: "",
      send_invite: true,
    },
  });

  useEffect(() => {
    async function fetchDepartments(): Promise<void> {
      try {
        const { data } = await api.get<DepartmentResponse[]>("/admin/departments");
        setDepartments(data);
      } catch {
        // Handled silently
      }
    }
    void fetchDepartments();
  }, []);

  async function onSubmit(formData: StudentFormData): Promise<void> {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        date_of_birth: new Date(formData.date_of_birth).toISOString(),
      };
      await api.post("/admin/users/student", payload);
      toast.success("Student created and temporary password sent via email");
      router.push("/admin/users/students");
    } catch (err: unknown) {
      applyValidationErrorsToForm(err, setError);
      toast.error(getApiErrorMessage(err, "Failed to create student"));
    } finally {
      setLoading(false);
    }
  }

  const deptOptions = [
    { value: "", label: "— Select Department —" },
    ...departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
  ];

  return (
    <div className="animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Students", href: "/admin/users/students" },
          { label: "Add New" },
        ]}
      />
      <GlassPageHeader title="Add Student" description="Create a new student account and profile" />

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
                  placeholder="student@university.edu"
                  {...register("email")}
                  error={errors.email?.message}
                />
                <GlassInput
                  label="Enrollment Number"
                  placeholder="e.g. EN2024001"
                  {...register("enrollment_number")}
                  error={errors.enrollment_number?.message}
                />
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200/60 text-xs text-blue-800 leading-relaxed">
                  🔒 A secure temporary password will be automatically generated and emailed to this student. They will be prompted to choose a new password upon first login.
                </div>
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
              <StudentFormFields
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
          <GlassButton variant="primary" type="submit" loading={loading} icon={<PlusCircle size={16} />}>
            Create Student
          </GlassButton>
        </div>
      </form>
    </div>
  );
}
