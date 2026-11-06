"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, GraduationCap, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import useSWR from "swr";
import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import { useDepartments } from "@/hooks/useReferenceData";
import Breadcrumb from "@/components/ui/Breadcrumb";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PageSkeleton from "@/components/ui/PageSkeleton";
import EditStudentFormFields from "./EditStudentFormFields";
import { studentUpdateSchema, StudentUpdateFormData } from "@/lib/validations/student";
import type { StudentResponse } from "@/types";

export default function EditStudentPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: student, error: studentError, isLoading: loading } = useSWR<StudentResponse>(
    `/admin/users/students/${id}`,
    { revalidateOnFocus: false }
  );
  const { items: departments } = useDepartments();
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
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
      batch_id: "",
      department_id: "",
    },
  });

  const departmentId = watch("department_id");
  const prevDepartmentRef = useRef<string>("");
  useEffect(() => {
    if (prevDepartmentRef.current && prevDepartmentRef.current !== departmentId) setValue("batch_id", "");
    prevDepartmentRef.current = departmentId;
  }, [departmentId, setValue]);

  // The form is filled once, from the first copy that arrives, so a background refresh never overwrites edits.
  const filledFor = useRef<string | null>(null);
  useEffect(() => {
    if (!student || filledFor.current === student.id) return;
    filledFor.current = student.id;
    reset({
      enrollment_number: student.enrollment_number,
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      phone: student.phone ?? "",
      gender: student.gender ?? "",
      date_of_birth: student.date_of_birth ? new Date(student.date_of_birth).toISOString().split("T")[0] : "",
      batch_id: student.batch_id ?? "",
      department_id: student.department_id ?? "",
    });
  }, [student, reset]);

  useEffect(() => {
    if (studentError) toast.error("Failed to load student data");
  }, [studentError]);

  async function onSubmit(formData: StudentUpdateFormData): Promise<void> {
    setSaving(true);
    try {
      await api.put(`/admin/users/students/${id}`, {
        enrollment_number: formData.enrollment_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
        gender: formData.gender || undefined,
        date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : undefined,
        batch_id: formData.batch_id,
        department_id: formData.department_id,
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

  if (loading) return <PageSkeleton text="Loading student..." />;
  if (!student) return <div className="text-center py-20 text-muted-foreground">Student not found</div>;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Students", href: "/admin/users/students" },
          { label: student.email, href: `/admin/users/students/${id}` },
          { label: "Edit" },
        ]}
      />
      <PageHeader title="Edit student profile" description="Update student personal and academic details." />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Card className="!p-0 overflow-hidden">
              <div className="p-5 border-b border-border bg-muted/40">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  Account Info
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Core system identifiers.</p>
              </div>
              <div className="p-5 space-y-4">
                <Input label="Email Address" value={student.email} disabled />
                <Input
                  label="Enrollment Number"
                  {...register("enrollment_number")}
                  error={errors.enrollment_number?.message}
                />
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
              <EditStudentFormFields
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
          <Button variant="primary" type="submit" loading={saving} icon={<Save size={16} />}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
