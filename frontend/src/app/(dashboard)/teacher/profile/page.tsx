"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { Building, Briefcase, Award, Shield, Mail } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import PageHeader from "@/components/ui/PageHeader";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Button from "@/components/ui/Button";
import PageSkeleton from "@/components/ui/PageSkeleton";
import type { UserProfile } from "@/types";

export default function TeacherProfilePage(): React.ReactElement {
  const { data: profile, error, isLoading: loading } = useSWR<UserProfile>("/auth/me");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, "Failed to load profile"));
  }, [error]);

  const sendResetEmail = async (email: string): Promise<void> => {
    setSending(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("A password change link has been sent to your email");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not send the email. Try again shortly."));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <PageSkeleton text="Loading profile..." />;
  if (!profile) return <div className="text-center py-20 text-muted-foreground text-xs">Profile unavailable</div>;

  const t = profile.teacher_profile;
  const initial = t?.first_name ? t.first_name[0].toUpperCase() : (profile.email ? profile.email[0].toUpperCase() : "U");

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Teacher", href: "/teacher/dashboard" },
          { label: "Profile" },
        ]}
      />

      <PageHeader
        title="Profile & security"
        description="View your faculty details and change your account password."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Profile Card */}
        <div className="lg:col-span-1 rounded-lg border border-border bg-card p-6 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-18 h-18 rounded-full bg-secondary text-primary font-semibold text-2xl flex items-center justify-center border-2 border-border mb-3">
              {initial}
            </div>
            <h2 className="text-base font-semibold text-foreground">
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

        {/* Security Card */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-secondary text-primary flex items-center justify-center border border-border">
              <Shield size={16} className="text-accent-strong" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Change Password</h3>
              <p className="text-xs text-muted-foreground">
                We email you a secure link to choose a new password. The link is valid for a limited time.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              loading={sending}
              icon={<Mail size={14} />}
              onClick={() => profile.email && sendResetEmail(profile.email)}
            >
              Email me a password change link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
