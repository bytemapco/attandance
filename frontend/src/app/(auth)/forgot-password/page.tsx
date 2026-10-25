"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, KeyRound, ArrowLeft, CheckCircle2, RotateCw } from "lucide-react";
import toast from "react-hot-toast";

import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";

export default function ForgotPasswordPage(): React.ReactElement {
  const [resending, setResending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const emailValue = watch("email");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  async function onSubmit(formData: ForgotPasswordFormData): Promise<void> {
    const cleanEmail = formData.email.trim().toLowerCase();
    try {
      await api.post("/auth/forgot-password", { email: cleanEmail });
      setSubmitted(true);
      setResendCooldown(30);
      toast.success("Password reset instructions dispatched!");
    } catch (err: unknown) {
      const handled = applyValidationErrorsToForm(err, setError);
      if (!handled) {
        toast.error(getApiErrorMessage(err, "Failed to send reset link."));
      }
    }
  }

  async function handleResend(): Promise<void> {
    if (resendCooldown > 0 || resending || !emailValue) return;
    setResending(true);
    const cleanEmail = emailValue.trim().toLowerCase();
    try {
      await api.post("/auth/forgot-password", { email: cleanEmail });
      setResendCooldown(30);
      toast.success("A fresh reset link has been dispatched!");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to resend reset link."));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto my-auto py-8">
      <div className="w-full">
        <div className="text-center mb-6">
          <Link href="/login" className="inline-block group cursor-pointer hover:opacity-90 transition-opacity">
            <div className="inline-flex p-3 rounded-xl bg-primary text-primary-foreground shadow-sm mb-3 group-hover:scale-105 transition-transform">
              <KeyRound size={26} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Smart Attendance
            </h1>
          </Link>
        </div>

        {submitted ? (
          <div className="rounded-2xl border border-border bg-card p-7 text-center space-y-5 shadow-sm">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-foreground">Check Your Inbox</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If an account exists for <strong className="text-foreground">{emailValue}</strong>, we sent a password reset link.
              </p>
              <p className="text-[11px] text-muted-foreground/80 pt-1">
                Check your spam folder if it doesn&apos;t arrive in a few minutes.
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <GlassButton
                variant="secondary"
                size="md"
                onClick={() => void handleResend()}
                disabled={resendCooldown > 0 || resending}
                className="w-full justify-center text-xs font-medium"
              >
                <RotateCw size={13} className={resending ? "animate-spin mr-1.5" : "mr-1.5"} />
                {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : "Resend Reset Link"}
              </GlassButton>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
                >
                  Use a different email
                </button>
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl border border-border bg-card p-7 space-y-5 shadow-sm"
          >
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">Reset Password</h2>
              <p className="text-xs text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <GlassInput
              label="Email Address"
              type="email"
              placeholder="name@university.edu"
              {...register("email")}
              error={errors.email?.message}
              icon={<Mail size={15} />}
              autoComplete="email"
            />

            <div className="pt-1 space-y-3">
              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}
                className="w-full font-medium"
              >
                Send Reset Link
              </GlassButton>

              <Link
                href="/login"
                className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                <ArrowLeft size={13} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
