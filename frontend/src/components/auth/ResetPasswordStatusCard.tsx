"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";

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
      <div className="rounded-lg border border-border bg-card p-7 text-center space-y-5">
        <div className="inline-flex p-3 rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle size={32} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Invalid or Expired Link</h2>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            {message || "This password reset link has expired or has already been used."}
          </p>
        </div>
        <Link href="/forgot-password" className="inline-block">
          <Button variant="secondary" size="sm">Request New Link</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-7 text-center space-y-5">
      <div className="inline-flex p-3 rounded-full bg-success/10 border border-success/20 text-success">
        <CheckCircle2 size={32} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Password updated</h2>
        <p className="text-xs text-muted-foreground mt-1.5">
          Your new password is now active. Redirecting to sign in...
        </p>
      </div>
      <Link href="/login" className="inline-block">
        <Button variant="primary" size="sm">Go to Login</Button>
      </Link>
    </div>
  );
}
