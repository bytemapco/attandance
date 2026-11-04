"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building, Briefcase, Award, Shield, Lock } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
import GlassLoader from "@/components/ui/GlassLoader";
import { changePasswordSchema, ChangePasswordFormData } from "@/lib/validations/auth";
import type { UserProfile } from "@/types";

export default function TeacherProfilePage(): React.ReactElement {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data } = await api.get<UserProfile>("/auth/me");
        setProfile(data);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load profile"));
      } finally {
        setLoading(false);
      }
    }
    void loadProfile();
  }, []);

  const handleChangePassword = async (formData: ChangePasswordFormData) => {
    try {
      await api.post("/auth/change-password", {
        current_password: formData.current_password,
        new_password: formData.new_password,
      });
      toast.success("Password updated successfully");
      reset();
    } catch (err: unknown) {
      applyValidationErrorsToForm(err, setError);
      toast.error(getApiErrorMessage(err, "Password update failed"));
    }
  };

  if (loading) return <GlassLoader text="Loading profile..." />;
  if (!profile) return <div className="text-center py-20 text-muted-foreground text-xs">Profile unavailable</div>;

  const t = profile.teacher_profile;
  const initial = t?.first_name ? t.first_name[0].toUpperCase() : (profile.email ? profile.email[0].toUpperCase() : "U");

  return (
    <div className="space-y-6">
      <GlassBreadcrumb
        items={[
          { label: "Teacher", href: "/teacher/dashboard" },
          { label: "Profile" },
        ]}
      />

      <GlassPageHeader
        title="Profile & Security"
        description="View your faculty details and update your account password."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Profile Card */}
        <div className="lg:col-span-1 rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-18 h-18 rounded-full bg-secondary text-primary font-bold text-2xl flex items-center justify-center border-2 border-border mb-3 shadow-2xs">
              {initial}
            </div>
            <h2 className="text-base font-bold text-foreground">
              {t ? `${t.first_name} ${t.last_name}` : profile.email}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
            <div className="mt-2.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-soft text-success border border-success-border">
                Faculty Member
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
                <Briefcase size={14} className="text-muted-foreground" /> Employee ID
              </span>
              <span className="font-mono text-foreground font-semibold">{t?.employee_id || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
                <Building size={14} className="text-muted-foreground" /> Department
              </span>
              <span className="text-foreground font-semibold">{t?.department || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
                <Award size={14} className="text-muted-foreground" /> Designation
              </span>
              <span className="text-foreground font-semibold">{t?.designation || "—"}</span>
            </div>
          </div>
        </div>

        {/* Security / Password Card */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-secondary text-primary flex items-center justify-center border border-border">
              <Shield size={16} className="text-accent-strong" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Change Password</h3>
              <p className="text-xs text-muted-foreground">Choose a strong password with at least 8 characters.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(handleChangePassword)} className="space-y-4 max-w-md">
            <GlassInput
              type="password"
              label="Current Password"
              placeholder="Enter current password"
              {...register("current_password")}
              error={errors.current_password?.message}
            />
            <GlassInput
              type="password"
              label="New Password"
              placeholder="Minimum 8 characters"
              {...register("new_password")}
              error={errors.new_password?.message}
            />
            <GlassInput
              type="password"
              label="Confirm New Password"
              placeholder="Re-enter new password"
              {...register("confirm_password")}
              error={errors.confirm_password?.message}
            />

            <div className="pt-2">
              <GlassButton type="submit" variant="primary" loading={isSubmitting} icon={<Lock size={14} />}>
                Update Password
              </GlassButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
