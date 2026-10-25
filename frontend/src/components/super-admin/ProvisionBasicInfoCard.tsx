"use client";

import React from "react";
import { Building } from "lucide-react";
import { UseFormRegister, FieldErrors, Control, Controller } from "react-hook-form";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassSelect from "@/components/ui/GlassSelect";
import type { TenantProvisionFormData } from "@/lib/validations/superAdmin";

interface ProvisionBasicInfoCardProps {
  register: UseFormRegister<TenantProvisionFormData>;
  errors: FieldErrors<TenantProvisionFormData>;
  control: Control<TenantProvisionFormData>;
  onNameChange: (val: string) => void;
}

const INSTITUTION_TYPES = [
  { value: "COLLEGE", label: "College / University" },
  { value: "SCHOOL", label: "School" },
  { value: "COACHING_CENTER", label: "Coaching / Training Center" },
];

export default function ProvisionBasicInfoCard({
  register,
  errors,
  control,
  onNameChange,
}: ProvisionBasicInfoCardProps): React.ReactElement {
  return (
    <GlassCard className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Building size={18} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Institution Details</h2>
          <p className="text-xs text-muted-foreground">
            Basic information and web address for this institution
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <GlassInput
          label="Institution Name"
          placeholder="e.g. Oxford Public School or City Engineering College"
          {...register("name")}
          onChange={(e) => onNameChange(e.target.value)}
          error={errors.name?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <GlassInput
              label="Short Web Name (Code)"
              placeholder="e.g. oxford or city-college"
              {...register("slug")}
              error={errors.slug?.message}
            />
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Used in login links and institution web address
            </span>
          </div>

          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <GlassSelect
                label="Institution Type"
                options={INSTITUTION_TYPES}
                value={field.value}
                onChange={field.onChange}
                error={errors.type?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GlassInput
            label="License Count"
            type="number"
            placeholder="0"
            {...register("license_count")}
            error={errors.license_count?.message}
          />

          <div>
            <GlassInput
              label="Custom Website Domain (Optional)"
              placeholder="e.g. attendance.school.edu"
              {...register("domain")}
              error={errors.domain?.message}
            />
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Leave empty if you do not have a custom domain
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
