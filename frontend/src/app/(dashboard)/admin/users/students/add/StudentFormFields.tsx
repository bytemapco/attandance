import React from "react";
import { UseFormRegister, Control, FieldErrors, Controller } from "react-hook-form";
import Input from "@/components/ui/Input";
import SelectField from "@/components/ui/SelectField";
import DepartmentBatchSelect from "@/components/admin/batches/DepartmentBatchSelect";
import type { StudentFormData } from "@/lib/validations/student";

interface StudentFormFieldsProps {
  register: UseFormRegister<StudentFormData>;
  control: Control<StudentFormData>;
  errors: FieldErrors<StudentFormData>;
  deptOptions: { value: string; label: string }[];
  departmentId?: string;
}

const GENDER_OPTIONS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
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
  departmentId,
}: StudentFormFieldsProps): React.ReactElement {
  return (
    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
      <Input
        label="First Name *"
        placeholder="e.g. Aanya"
        {...register("first_name")}
        error={errors.first_name?.message}
      />
      <Input
        label="Last Name *"
        placeholder="e.g. Sharma"
        {...register("last_name")}
        error={errors.last_name?.message}
      />
      <Input
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
          <SelectField
            label="Gender *"
            options={[{ value: "", label: "— Select Gender —" }, ...GENDER_OPTIONS]}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            error={errors.gender?.message}
          />
        )}
      />
      <Input
        label="Date of Birth *"
        type="date"
        {...register("date_of_birth")}
        error={errors.date_of_birth?.message}
      />
      <Controller
        control={control}
        name="department_id"
        render={({ field }) => (
          <SelectField
            label="Department *"
            options={deptOptions}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            error={errors.department_id?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="batch_id"
        render={({ field }) => (
          <DepartmentBatchSelect
            label="Batch *"
            departmentId={departmentId ?? ""}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            error={errors.batch_id?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="semester"
        render={({ field }) => (
          <SelectField
            label="Semester *"
            options={[{ value: "", label: "— Select Semester —" }, ...SEMESTER_OPTIONS]}
            value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
            onChange={(val) => field.onChange(val ? Number(val) : undefined)}
            error={errors.semester?.message}
          />
        )}
      />
    </div>
  );
}
