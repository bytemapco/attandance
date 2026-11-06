"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, GraduationCap, PlusCircle, X, Lock } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import Breadcrumb from "@/components/ui/Breadcrumb";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import StudentFormFields from "./StudentFormFields";
import { studentFormSchema, StudentFormData } from "@/lib/validations/student";
import type { DepartmentResponse, StudentResponse } from "@/types";

export default function AddStudentPage(): React.ReactElement {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    watch,
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
      batch_id: "",
      department_id: "",
      send_invite: true,
    },
  });

  const departmentId = watch("department_id");
  const prevDepartmentRef = useRef<string>("");
  useEffect(() => {
    if (prevDepartmentRef.current && prevDepartmentRef.current !== departmentId) setValue("batch_id", "");
    prevDepartmentRef.current = departmentId;
  }, [departmentId, setValue]);

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
      const { data: created } = await api.post<StudentResponse>("/admin/users/student", payload);
      if (created.invitation_sent === false) {
        toast.error("Student created, but the invitation email could not be sent. Check SMTP settings, then trigger a password reset.");
      } else if (created.invitation_sent) {
        toast.success("Student created and temporary password sent via email");
      } else {
        toast.success("Student created.");
      }
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
    <div>
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Students", href: "/admin/users/students" },
          { label: "Add New" },
        ]}
      />
      <PageHeader title="Add student" description="Create a new student account and profile" />

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="!p-0 overflow-hidden">
              <div className="p-5 border-b border-border bg-muted/40">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  Account Info
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Core system credentials.</p>
              </div>
              <div className="p-5 space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="student@university.edu"
                  {...register("email")}
                  error={errors.email?.message}
                />
                <Input
                  label="Enrollment Number"
                  placeholder="e.g. EN2024001"
                  {...register("enrollment_number")}
                  error={errors.enrollment_number?.message}
                />
                <div className="flex items-start gap-2.5 rounded-lg border border-info-border bg-info-soft p-3.5 text-sm text-info">
                  <Lock size={14} className="mt-0.5 shrink-0" aria-hidden />
                  <span>A temporary password is generated and emailed to this student. They choose a new one on first sign-in.</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="!p-0 h-full">
              <div className="p-5 border-b border-border bg-muted/40 rounded-t-[inherit]">
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
                departmentId={departmentId}
              />
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 pb-12">
          <Button variant="ghost" type="button" onClick={() => router.back()} icon={<X size={16} />}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading} icon={<PlusCircle size={16} />}>
            Create Student
          </Button>
        </div>
      </form>
    </div>
  );
}
