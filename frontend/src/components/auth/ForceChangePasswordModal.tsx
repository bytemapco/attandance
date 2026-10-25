"use client";

import React, { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, CheckCircle2, ShieldCheck, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";

const forceChangePasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/\d/, "Must contain at least one number (0-9)")
      .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "Must contain at least one special symbol"),
    confirm_password: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ForceChangePasswordData = z.infer<typeof forceChangePasswordSchema>;

interface ForceChangePasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export default function ForceChangePasswordModal({
  isOpen,
  onSuccess,
}: ForceChangePasswordModalProps): React.ReactElement | null {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForceChangePasswordData>({
    resolver: zodResolver(forceChangePasswordSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  const newPassword = useWatch({ control, name: "new_password" }) || "";
  const confirmPassword = useWatch({ control, name: "confirm_password" }) || "";

  const rules = useMemo(() => [
    { label: "At least 8 characters", valid: newPassword.length >= 8 },
    { label: "Uppercase & lowercase letters", valid: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword) },
    { label: "At least one number (0-9)", valid: /\d/.test(newPassword) },
    { label: "At least one special symbol", valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword) },
  ], [newPassword]);

  const passwordsMatch = useMemo(
    () => newPassword.length > 0 && newPassword === confirmPassword,
    [newPassword, confirmPassword]
  );

  if (!isOpen) return null;

  async function onSubmit(data: ForceChangePasswordData): Promise<void> {
    try {
      await api.post("/auth/change-password", {
        new_password: data.new_password,
      });
      toast.success("Password updated successfully!");
      onSuccess();
    } catch (err: unknown) {
      applyValidationErrorsToForm(err, setError);
      toast.error(getApiErrorMessage(err, "Failed to update password."));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Set Permanent Password</h2>
            <p className="text-xs text-muted-foreground">Create a secure password to activate your account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <GlassInput
            label="New Permanent Password"
            type="password"
            placeholder="Create a strong password"
            {...register("new_password")}
            error={errors.new_password?.message}
            icon={<Lock size={15} />}
            autoComplete="new-password"
          />

          <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Security Requirements</p>
            <div className="grid grid-cols-1 gap-1">
              {rules.map((rule) => (
                <div key={rule.label} className="flex items-center gap-2 text-xs">
                  {rule.valid ? (
                    <Check size={13} className="text-emerald-600 shrink-0" />
                  ) : (
                    <X size={13} className="text-muted-foreground/60 shrink-0" />
                  )}
                  <span className={rule.valid ? "text-emerald-700 font-medium" : "text-muted-foreground"}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <GlassInput
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter permanent password"
            {...register("confirm_password")}
            error={errors.confirm_password?.message}
            icon={<Lock size={15} />}
            autoComplete="new-password"
          />

          {confirmPassword.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs px-1">
              {passwordsMatch ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-700 font-medium">Passwords match</span>
                </>
              ) : (
                <>
                  <X size={14} className="text-rose-600" />
                  <span className="text-rose-600">Passwords do not match</span>
                </>
              )}
            </div>
          )}

          <div className="pt-2">
            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full"
              icon={<CheckCircle2 size={16} />}
            >
              Activate Account & Continue
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}
