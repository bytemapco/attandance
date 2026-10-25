import React from "react";
import { UseFormRegister, Control, FieldErrors, Controller } from "react-hook-form";
import GlassInput from "@/components/ui/GlassInput";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassCard from "@/components/ui/GlassCard";
import { Briefcase } from "lucide-react";
import type { TeacherFormData } from "@/lib/validations/teacher";

interface TeacherFormProfileProps {
  register: UseFormRegister<TeacherFormData>;
  control: Control<TeacherFormData>;
  errors: FieldErrors<TeacherFormData>;
  deptOptions: { value: string; label: string }[];
  desigOptions: { value: string; label: string }[];
}

export default function TeacherFormProfile({
  register,
  control,
  errors,
  deptOptions,
  desigOptions,
}: TeacherFormProfileProps): React.ReactElement {
  return (
    <div className="space-y-6">
      <GlassCard className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/40">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Briefcase size={18} className="text-primary" />
            Personal Details
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Faculty identity and contact records.</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <GlassInput
            label="First Name"
            placeholder="e.g. Ravi"
            {...register("first_name")}
            error={errors.first_name?.message}
          />
          <GlassInput
            label="Last Name"
            placeholder="e.g. Shankar"
            {...register("last_name")}
            error={errors.last_name?.message}
          />
          <div className="sm:col-span-2">
            <GlassInput
              label="Phone (optional)"
              type="tel"
              placeholder="+91 98765 43210"
              {...register("phone")}
              error={errors.phone?.message}
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/40">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Briefcase size={18} className="text-primary" />
            Institutional Assignment
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Departmental and role configuration.</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Controller
            control={control}
            name="department_id"
            render={({ field }) => (
              <GlassSelect
                label="Department"
                options={deptOptions}
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
                label="Designation"
                options={desigOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.designation_id?.message}
              />
            )}
          />
        </div>
      </GlassCard>
    </div>
  );
}
