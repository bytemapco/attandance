import React from "react";
import { UseFormRegister, Control, FieldErrors, Controller } from "react-hook-form";
import GlassInput from "@/components/ui/GlassInput";
import GlassSelect from "@/components/ui/GlassSelect";
import type { TeacherUpdateFormData } from "@/lib/validations/teacher";

interface EditTeacherFormFieldsProps {
  register: UseFormRegister<TeacherUpdateFormData>;
  control: Control<TeacherUpdateFormData>;
  errors: FieldErrors<TeacherUpdateFormData>;
  deptOptions: { value: string; label: string }[];
  desigOptions: { value: string; label: string }[];
}

export default function EditTeacherFormFields({
  register,
  control,
  errors,
  deptOptions,
  desigOptions,
}: EditTeacherFormFieldsProps): React.ReactElement {
  return (
    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
      <GlassInput
        label="First Name *"
        {...register("first_name")}
        error={errors.first_name?.message}
      />
      <GlassInput
        label="Last Name *"
        {...register("last_name")}
        error={errors.last_name?.message}
      />
      <Controller
        control={control}
        name="department_id"
        render={({ field }) => (
          <GlassSelect
            label="Department *"
            options={[{ value: "", label: "— Select Department —" }, ...deptOptions]}
            value={field.value}
            onChange={field.onChange}
            error={errors.department_id?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="designation_id"
        render={({ field }) => (
          <GlassSelect
            label="Designation *"
            options={[{ value: "", label: "— Select Designation —" }, ...desigOptions]}
            value={field.value}
            onChange={field.onChange}
            error={errors.designation_id?.message}
          />
        )}
      />
      <div className="sm:col-span-2">
        <GlassInput
          label="Phone (optional)"
          type="tel"
          {...register("phone")}
          error={errors.phone?.message}
        />
      </div>
    </div>
  );
}
