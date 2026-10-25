import React from "react";
import { UseFormRegister, Control, FieldErrors, Controller } from "react-hook-form";
import GlassInput from "@/components/ui/GlassInput";
import GlassSelect from "@/components/ui/GlassSelect";
import type { StudentFormData } from "@/lib/validations/student";

interface StudentFormFieldsProps {
  register: UseFormRegister<StudentFormData>;
  control: Control<StudentFormData>;
  errors: FieldErrors<StudentFormData>;
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

export default function StudentFormFields({
  register,
  control,
  errors,
  deptOptions,
}: StudentFormFieldsProps): React.ReactElement {
  return (
    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
      <GlassInput
        label="First Name *"
        placeholder="e.g. Aanya"
        {...register("first_name")}
        error={errors.first_name?.message}
      />
      <GlassInput
        label="Last Name *"
        placeholder="e.g. Sharma"
        {...register("last_name")}
        error={errors.last_name?.message}
      />
      <GlassInput
        label="Phone *"
        type="tel"
        placeholder="+91 98765 43210"
        {...register("phone")}
        error={errors.phone?.message}
      />
      <Controller
        control={control}
        name="gender"
        render={({ field }) => (
          <GlassSelect
            label="Gender *"
            options={[{ value: "", label: "— Select Gender —" }, ...GENDER_OPTIONS]}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            error={errors.gender?.message}
          />
        )}
      />
      <GlassInput
        label="Date of Birth *"
        type="date"
        {...register("date_of_birth")}
        error={errors.date_of_birth?.message}
      />
      <Controller
        control={control}
        name="department_id"
        render={({ field }) => (
          <GlassSelect
            label="Department *"
            options={deptOptions}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            error={errors.department_id?.message}
          />
        )}
      />
      <GlassInput
        label="Branch *"
        placeholder="e.g. CE, IoT-IT, AI"
        {...register("branch")}
        error={errors.branch?.message}
      />
      <Controller
        control={control}
        name="semester"
        render={({ field }) => (
          <GlassSelect
            label="Semester *"
            options={[{ value: "", label: "— Select Semester —" }, ...SEMESTER_OPTIONS]}
            value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
            onChange={(val) => field.onChange(val ? Number(val) : undefined)}
            error={errors.semester?.message}
          />
        )}
      />
      <div className="sm:col-span-2">
        <GlassInput
          label="Batch *"
          placeholder="e.g. 2022-2026"
          {...register("batch")}
          error={errors.batch?.message}
        />
      </div>
    </div>
  );
}
