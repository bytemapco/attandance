"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Shield, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { useAuthStore } from "@/store/authStore";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import ForceChangePasswordModal from "@/components/auth/ForceChangePasswordModal";
import type { TokenResponse, UserProfile } from "@/types";

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const { login, setUser } = useAuthStore();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);
  const [suspensionError, setSuspensionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function handleSuccessRedirect(profile: UserProfile): void {
    if (profile.role === "SUPER_ADMIN") router.push("/super-admin/dashboard");
    else if (profile.role === "ADMIN" || profile.role === "TENANT_ADMIN") router.push("/admin/dashboard");
    else router.push("/teacher/classes");
  }

  async function onSubmit(formData: LoginFormData): Promise<void> {
    setSuspensionError(null);
    const cleanEmail = formData.email.trim().toLowerCase();
    try {
      const { data: tokenData } = await api.post<TokenResponse>("/auth/login", {
        email: cleanEmail,
        password: formData.password,
      });
      const { data: profile } = await api.get<UserProfile>("/auth/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (profile.role === "STUDENT") {
        setError("email", { message: "Student accounts must access via the Smart Attendance Mobile App." });
        toast.error("Access Restricted: Student accounts must use the Mobile App.");
        return;
      }

      login(tokenData.access_token, profile);

      if (tokenData.must_change_password || profile.must_change_password) {
        setPendingProfile(profile);
        setShowPasswordModal(true);
        return;
      }

      toast.success("Welcome back!");
      handleSuccessRedirect(profile);
    } catch (err: unknown) {
      const errorMsg = getApiErrorMessage(err, "Login failed. Please check your credentials.");
      if (errorMsg.toLowerCase().includes("suspended") || errorMsg.toLowerCase().includes("suspension")) {
        setSuspensionError(errorMsg);
        toast.error("Institution Suspended: Access is temporarily restricted.");
        return;
      }
      const handled = applyValidationErrorsToForm(err, setError);
      if (!handled) toast.error(errorMsg);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto my-auto py-8">
      <div className="w-full">
        <div className="text-center mb-6">
          <Link href="/login" className="inline-block group cursor-pointer hover:opacity-90 transition-opacity">
            <div className="inline-flex p-3 rounded-xl bg-primary text-primary-foreground shadow-sm mb-3 group-hover:scale-105 transition-transform">
              <Shield size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Smart Attendance
            </h1>
          </Link>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-border bg-card p-7 shadow-sm space-y-5"
        >
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Sign In</h2>
            <p className="text-xs text-muted-foreground">
              Sign in with your email and password
            </p>
          </div>

          {suspensionError && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left flex gap-3 items-start animate-in fade-in duration-200">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-500">Institution Suspended</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{suspensionError}</p>
              </div>
            </div>
          )}

          <div className="space-y-3.5">
            <GlassInput
              label="Email Address"
              type="email"
              placeholder="name@university.edu"
              {...register("email")}
              error={errors.email?.message}
              icon={<Mail size={15} />}
              autoComplete="email"
            />

            <div>
              <GlassInput
                label="Password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                error={errors.password?.message}
                icon={<Lock size={15} />}
                autoComplete="current-password"
              />
              <div className="flex justify-end pt-1.5">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full font-medium"
            >
              Sign In to Dashboard
            </GlassButton>
          </div>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Protected by Smart Attendance Zero-Trust Verification
        </p>
      </div>

      <ForceChangePasswordModal
        isOpen={showPasswordModal}
        onSuccess={() => {
          setShowPasswordModal(false);
          if (pendingProfile) {
            setUser({ ...pendingProfile, must_change_password: false });
            handleSuccessRedirect(pendingProfile);
          }
        }}
      />
    </div>
  );
}
