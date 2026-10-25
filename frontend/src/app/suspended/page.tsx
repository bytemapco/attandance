"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Building2, AlertTriangle, Mail, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function SuspendedPage(): React.ReactElement {
  const router = useRouter();
  const { user, suspensionReason, logout } = useAuthStore();

  const tenantName = user?.tenant_name ?? "Your Institution";
  const email = user?.email ?? "";

  const handleLogout = (): void => {
    logout();
    router.replace("/login");
  };

  const handleContactSupport = (): void => {
    const subject = encodeURIComponent(`Account Suspension Inquiry - ${tenantName}`);
    const body = encodeURIComponent(`Hello,\n\nI am ${email} and my institution account "${tenantName}" appears to be suspended. Please assist.\n\nThank you.`);
    window.open(`mailto:support@smartattendance.io?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="relative inline-flex">
          <div className="w-24 h-24 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-amber-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Account Suspended</h1>
          <p className="text-muted-foreground leading-relaxed">
            {suspensionReason ? (
              <span>{suspensionReason}</span>
            ) : (
              <>
                <span className="font-semibold text-foreground">{tenantName}</span> has been temporarily
                suspended. Access is paused until your institution is reactivated.
              </>
            )}
          </p>
        </div>

        {/* Info box */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-left space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Status Details
          </p>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li className="flex gap-2 items-start">
              <span className="text-amber-400 mt-0.5">•</span>
              Access is temporarily paused
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-amber-400 mt-0.5">•</span>
              Your attendance and class records are preserved
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-amber-400 mt-0.5">•</span>
              Full access will resume upon reactivation
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleContactSupport}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            Sign Out
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
