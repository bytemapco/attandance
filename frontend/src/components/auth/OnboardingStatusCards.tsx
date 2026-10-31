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
    <div className="rounded-2xl border border-[#f0c9c9] bg-card p-6 sm:p-7 text-center space-y-5 shadow-[0_4px_16px_rgba(40,54,59,0.06)]">
      <div className="inline-flex p-3 rounded-full bg-[#f9eaea] border border-[#f0c9c9] text-[#b54242]">
        <AlertCircle size={32} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#202b30]">Invalid Invitation Link</h2>
        <p className="text-xs text-[#526f78] mt-1.5 leading-relaxed">
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
    <div className="rounded-2xl border border-[#c6e2d3] bg-card p-6 sm:p-7 text-center space-y-5 shadow-[0_4px_16px_rgba(40,54,59,0.06)]">
      <div className="inline-flex p-3 rounded-full bg-[#e8f3ed] border border-[#c6e2d3] text-[#247653]">
        <CheckCircle2 size={32} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#202b30]">Account Activated</h2>
        <p className="text-xs text-[#526f78] mt-1.5">
          Your credentials have been configured. Redirecting to sign in...
        </p>
      </div>
      <Link href="/login" className="inline-block">
        <GlassButton variant="primary" size="sm">Sign In Now</GlassButton>
      </Link>
    </div>
  );
}
