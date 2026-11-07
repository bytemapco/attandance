"use client";

import React from "react";
import { Building } from "lucide-react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import type { TenantProvisionFormData } from "@/lib/validations/superAdmin";

interface ProvisionBasicInfoCardProps {
  register: UseFormRegister<TenantProvisionFormData>;
  errors: FieldErrors<TenantProvisionFormData>;
  onNameChange: (val: string) => void;
}

export default function ProvisionBasicInfoCard({
  register,
  errors,
  onNameChange,
}: ProvisionBasicInfoCardProps): React.ReactElement {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Building size={18} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Institution Information</h2>
          <p className="text-xs text-muted-foreground">
            Name and license allocation
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          label="Institution Name"
          placeholder="e.g. Oxford Public School or City Engineering College"
          {...register("name")}
          onChange={(e) => onNameChange(e.target.value)}
          error={errors.name?.message ?? errors.slug?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Institution Type"
            value="College / University"
            readOnly
          />
        </div>

        <div className="max-w-sm">
          <Input
            label="License Quota"
            type="number"
            placeholder="0"
            {...register("license_count")}
            error={errors.license_count?.message}
          />

        </div>
      </div>
    </Card>
  );
}
