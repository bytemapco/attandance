"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";

interface OnboardingInvalidCardProps {
  message?: string;
}

export function OnboardingInvalidCard({ message }: OnboardingInvalidCardProps): React.ReactElement {
  return (
    <div className="rounded-2xl border border-destructive-border bg-card p-6 sm:p-7 text-center space-y-5 shadow-[0_4px_16px_rgba(40,54,59,0.06)]">
      <div className="inline-flex p-3 rounded-full bg-destructive-soft border border-destructive-border text-destructive">
        <AlertCircle size={32} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">Invalid Invitation Link</h2>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          {message || "This invitation link is invalid or has expired."}
        </p>
      </div>
      <Link href="/login" className="inline-block">
        <GlassButton variant="secondary" size="sm">Back to Sign In</GlassButton>
      </Link>
    </div>
  );
}

export function OnboardingCompletedCard(): React.ReactElement {
  return (
    <div className="rounded-2xl border border-success-border bg-card p-6 sm:p-7 text-center space-y-5 shadow-[0_4px_16px_rgba(40,54,59,0.06)]">
      <div className="inline-flex p-3 rounded-full bg-success-soft border border-success-border text-success">
        <CheckCircle2 size={32} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">Account Activated</h2>
        <p className="text-xs text-muted-foreground mt-1.5">
          Your credentials have been configured. Redirecting to sign in...
        </p>
      </div>
      <Link href="/login" className="inline-block">
        <GlassButton variant="primary" size="sm">Sign In Now</GlassButton>
      </Link>
    </div>
  );
}
