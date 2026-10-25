import React from "react";
import { UseFormRegister, Control, FieldErrors, Controller } from "react-hook-form";
import GlassInput from "@/components/ui/GlassInput";
import GlassSelect from "@/components/ui/GlassSelect";
import type { StudentUpdateFormData } from "@/lib/validations/student";

interface EditStudentFormFieldsProps {
  register: UseFormRegister<StudentUpdateFormData>;
  control: Control<StudentUpdateFormData>;
  errors: FieldErrors<StudentUpdateFormData>;
  deptOptions: { value: string; label: string }[];
}

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

export default function EditStudentFormFields({
  register,
  control,
  errors,
  deptOptions,
}: EditStudentFormFieldsProps): React.ReactElement {
  return (
    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
      <GlassInput
        label="First Name"
        {...register("first_name")}
        error={errors.first_name?.message}
      />
      <GlassInput
        label="Last Name"
        {...register("last_name")}
        error={errors.last_name?.message}
      />
      <GlassInput
        label="Phone (optional)"
        type="tel"
        {...register("phone")}
        error={errors.phone?.message}
      />
      <Controller
        control={control}
        name="gender"
        render={({ field }) => (
          <GlassSelect
            label="Gender (optional)"
            options={[{ value: "", label: "— Select —" }, ...GENDER_OPTIONS]}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            error={errors.gender?.message}
          />
        )}
      />
      <GlassInput
        label="Date of Birth (optional)"
        type="date"
        {...register("date_of_birth")}
        error={errors.date_of_birth?.message}
      />
      <Controller
        control={control}
        name="semester"
        render={({ field }) => (
          <GlassSelect
            label="Semester (optional)"
            options={[{ value: "", label: "— Select —" }, ...SEMESTER_OPTIONS]}
            value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
            onChange={(val) => field.onChange(val ? Number(val) : undefined)}
            error={errors.semester?.message}
          />
        )}
      />
      <GlassInput
        label="Branch (optional)"
        placeholder="e.g. CE, IoT-IT, AI"
        {...register("branch")}
        error={errors.branch?.message}
      />
      <GlassInput
        label="Batch (optional)"
        {...register("batch")}
        error={errors.batch?.message}
      />
      <Controller
        control={control}
        name="department_id"
        render={({ field }) => (
          <GlassSelect
            label="Department (optional)"
            options={deptOptions}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            error={errors.department_id?.message}
          />
        )}
      />
    </div>
  );
}
