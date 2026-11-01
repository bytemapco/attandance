"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, AlertTriangle } from "lucide-react";
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
    else router.push("/teacher/dashboard");
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
        setError("email", { message: "Student accounts must access via the SAHAJ Mobile App." });
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
    <div className="w-full max-w-[420px] mx-auto my-auto py-8 px-4">
      <div className="rounded-2xl border border-[#e3e1dc]/90 bg-white/95 backdrop-blur-md p-7 sm:p-8 shadow-[0_10px_30px_rgba(40,54,59,0.08),0_1px_3px_rgba(40,54,59,0.04)]">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link
            href="/login"
            className="group inline-flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
          >
            <img
              src="/sahaj-logo-transparent.png"
              alt="SAHAJ Logo"
              className="h-10 sm:h-11 w-auto object-contain"
            />
          </Link>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {suspensionError && (
            <div className="rounded-xl border border-[#f2deba] bg-[#fbf1df] p-4 text-left flex gap-3 items-start animate-in fade-in duration-200">
              <AlertTriangle className="w-5 h-5 text-[#8a5b12] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#8a5b12]">Institution Suspended</p>
                <p className="text-xs text-[#526f78] leading-relaxed">{suspensionError}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
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
                  className="text-xs font-medium text-[#526f78] hover:text-[#202b30] transition-colors focus:outline-none focus:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full font-semibold shadow-sm hover:shadow transition-shadow"
            >
              Sign In to Dashboard
            </GlassButton>
          </div>
        </form>
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
