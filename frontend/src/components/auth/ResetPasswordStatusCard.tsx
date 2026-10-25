"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";

interface ResetPasswordStatusCardProps {
  status: "invalid" | "completed";
  message?: string;
}

export default function ResetPasswordStatusCard({
  status,
  message,
}: ResetPasswordStatusCardProps): React.ReactElement {
  if (status === "invalid") {
    return (
      <div className="rounded-2xl border border-border bg-card p-7 text-center space-y-5 shadow-sm">
        <div className="inline-flex p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
          <AlertCircle size={32} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Invalid or Expired Link</h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            {message || "This password reset link has expired or has already been used."}
          </p>
        </div>
        <Link href="/forgot-password" className="inline-block">
          <GlassButton variant="secondary" size="sm">Request New Link</GlassButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-7 text-center space-y-5 shadow-sm">
      <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
        <CheckCircle2 size={32} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Password Updated!</h2>
        <p className="text-xs text-muted-foreground mt-1.5">
          Your new password is now active. Redirecting to sign in...
        </p>
      </div>
      <Link href="/login" className="inline-block">
        <GlassButton variant="primary" size="sm">Go to Login</GlassButton>
      </Link>
    </div>
  );
}
