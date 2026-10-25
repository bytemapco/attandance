"use client";

import React from "react";
import { Plus, Trash2, Shield, Users } from "lucide-react";
import { UseFormRegister, FieldErrors, UseFieldArrayReturn } from "react-hook-form";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import type { TenantProvisionFormData } from "@/lib/validations/superAdmin";

interface ProvisionAdminAccountsCardProps {
  register: UseFormRegister<TenantProvisionFormData>;
  errors: FieldErrors<TenantProvisionFormData>;
  fieldArray: UseFieldArrayReturn<TenantProvisionFormData, "admins">;
}

export default function ProvisionAdminAccountsCard({
  register,
  errors,
  fieldArray,
}: ProvisionAdminAccountsCardProps): React.ReactElement {
  const { fields, append, remove } = fieldArray;

  return (
    <GlassCard className="p-6 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Main Administrator Accounts
            </h2>
            <p className="text-xs text-muted-foreground">
              Administrators with complete access to manage students, teachers, classes, and institution settings
            </p>
          </div>
        </div>

        <GlassButton
          type="button"
          variant="secondary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => append({ name: "", email: "", role: "TENANT_ADMIN" })}
        >
          Add Another Administrator
        </GlassButton>
      </div>

      {errors.admins?.root && (
        <p className="text-xs font-medium text-destructive">
          {errors.admins.root.message}
        </p>
      )}

      <div className="space-y-4">
        {fields.map((fieldItem, index) => (
          <div
            key={fieldItem.id}
            className="p-4 rounded-xl border border-border bg-card/60 relative space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users size={12} />
                Administrator {index + 1}
              </span>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput
                label="Full Name"
                placeholder="e.g. John Doe"
                {...register(`admins.${index}.name`)}
                error={errors.admins?.[index]?.name?.message}
              />

              <GlassInput
                label="Email Address"
                type="email"
                placeholder="e.g. principal@school.edu"
                {...register(`admins.${index}.email`)}
                error={errors.admins?.[index]?.email?.message}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
