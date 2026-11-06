import React from "react";
import { UseFormRegister, Control, FieldErrors, Controller } from "react-hook-form";
import Input from "@/components/ui/Input";
import SelectField from "@/components/ui/SelectField";
import DepartmentBatchSelect from "@/components/admin/batches/DepartmentBatchSelect";
import type { StudentUpdateFormData } from "@/lib/validations/student";

interface EditStudentFormFieldsProps {
  register: UseFormRegister<StudentUpdateFormData>;
  control: Control<StudentUpdateFormData>;
  errors: FieldErrors<StudentUpdateFormData>;
  deptOptions: { value: string; label: string }[];
  departmentId?: string;
}

const GENDER_OPTIONS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
];


export default function EditStudentFormFields({
  register,
  control,
  errors,
  deptOptions,
  departmentId,
}: EditStudentFormFieldsProps): React.ReactElement {
  return (
    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
      <Input
        label="First Name"
        {...register("first_name")}
        error={errors.first_name?.message}
      />
      <Input
        label="Last Name"
        {...register("last_name")}
        error={errors.last_name?.message}
      />
      <Input
        label="Phone (optional)"
        type="tel"
        {...register("phone")}
        error={errors.phone?.message}
      />
      <Controller
        control={control}
        name="gender"
        render={({ field }) => (
          <SelectField
            label="Gender (optional)"
            options={[{ value: "", label: "— Select —" }, ...GENDER_OPTIONS]}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            error={errors.gender?.message}
          />
        )}
      />
      <Input
        label="Date of Birth (optional)"
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
    </div>
  );
}
