"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import toast from "react-hot-toast";

import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations/auth";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import PasswordRequirementsChecklist from "@/components/auth/PasswordRequirementsChecklist";
import ResetPasswordStatusCard from "@/components/auth/ResetPasswordStatusCard";
import StudentMobileAppCallout from "@/components/auth/StudentMobileAppCallout";

interface VerifyData {
  valid: boolean;
  email?: string;
  role?: string;
  name?: string;
  message?: string;
}

function ResetPasswordContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [verifying, setVerifying] = useState(true);
  const [tokenData, setTokenData] = useState<VerifyData | null>(null);
  const [completed, setCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const passwordValue = watch("password") || "";

  useEffect(() => {
    async function checkToken(): Promise<void> {
      if (!token) {
        setVerifying(false);
        setTokenData({ valid: false, message: "Missing password reset token." });
        return;
      }
      try {
        const { data } = await api.get<VerifyData>(
          `/auth/verify-token?token=${encodeURIComponent(token)}&token_type=reset`
        );
        setTokenData(data);
      } catch (err) {
        setTokenData({
          valid: false,
          message: getApiErrorMessage(err, "Failed to verify reset token."),
        });
      } finally {
        setVerifying(false);
      }
    }
    void checkToken();
  }, [token]);

  async function onSubmit(formData: ResetPasswordFormData): Promise<void> {
    if (!token) return;
    try {
      await api.post("/auth/reset-password", {
        token,
        new_password: formData.password,
      });
      setCompleted(true);
      toast.success("Password has been reset successfully!");
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: unknown) {
      const handled = applyValidationErrorsToForm(err, setError);
      if (!handled) {
        toast.error(getApiErrorMessage(err, "Failed to reset password."));
      }
    }
  }

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3">
        <GlassLoader text="Verifying password reset token..." />
      </div>
    );
  }

  if (!tokenData?.valid) {
    return <ResetPasswordStatusCard status="invalid" message={tokenData?.message} />;
  }

  if (completed) {
    return <ResetPasswordStatusCard status="completed" />;
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-lg border border-border bg-card p-6 sm:p-7 space-y-4 shadow-[0_4px_16px_rgba(40,54,59,0.06)]"
    >
      <div className="space-y-1">
        <h2 className="text-base font-bold text-foreground">Choose New Password</h2>
        <p className="text-xs text-muted-foreground">
          {tokenData.name
            ? `Resetting password for ${tokenData.name} (${tokenData.email})`
            : `Resetting password for ${tokenData.email}`}
        </p>
      </div>

      {tokenData.role === "STUDENT" && <StudentMobileAppCallout token={token} />}

      <div className="space-y-3">
        <GlassInput
          label="New Password"
          type="password"
          placeholder="••••••••"
          {...register("password")}
          error={errors.password?.message}
          icon={<Lock size={15} />}
          autoComplete="new-password"
        />

        <PasswordRequirementsChecklist password={passwordValue} />

        <GlassInput
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
          icon={<Lock size={15} />}
          autoComplete="new-password"
        />
      </div>

      <div className="pt-1">
        <GlassButton
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          className="w-full font-semibold"
        >
          Update Password
        </GlassButton>
      </div>
    </form>
  );
}

export default function ResetPasswordPage(): React.ReactElement {
  return (
    <div className="w-full max-w-md mx-auto my-auto py-8">
      <div className="w-full">
        <div className="text-center mb-6">
          <Link href="/login" className="inline-block group cursor-pointer hover:opacity-95 transition-opacity">
            <div className="inline-flex items-center justify-center mb-3">
              <img
                src="/sahaj-app-icon.png"
                alt="SAHAJ Logo"
                className="w-14 h-14 rounded-lg shadow-sm object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              SAHAJ
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Campus, made effortless.</p>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <GlassLoader />
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
