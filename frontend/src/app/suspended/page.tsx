"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Building2, AlertTriangle, Mail, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import GlassButton from "@/components/ui/GlassButton";

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
    window.open(`mailto:support@sahajcampus.com?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="max-w-md w-full text-center space-y-7">
        <div className="relative inline-flex">
          <div className="w-20 h-20 rounded-2xl bg-[#fbf1df] border border-[#f2deba] flex items-center justify-center">
            <Building2 className="w-10 h-10 text-[#8a5b12]" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#f9eaea] border border-[#f0c9c9] flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-[#b54242]" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-[#28363b]">Account Suspended</h1>
          <p className="text-xs sm:text-sm text-[#526f78] leading-relaxed">
            {suspensionReason ? (
              <span>{suspensionReason}</span>
            ) : (
              <>
                <span className="font-semibold text-[#202b30]">{tenantName}</span> has been temporarily
                suspended. Access is paused until your institutional license is reactivated.
              </>
            )}
          </p>
        </div>

        <div className="rounded-xl border border-[#f2deba] bg-[#fbf1df]/60 p-4 text-left space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a5b12]">
            Status Details
          </p>
          <ul className="text-xs text-[#526f78] space-y-1.5">
            <li className="flex gap-2 items-start">
              <span className="text-[#8a5b12] font-bold mt-0.5">•</span>
              Administrative and faculty access is temporarily paused
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-[#8a5b12] font-bold mt-0.5">•</span>
              All attendance records, biometrics, and class history remain securely preserved
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-[#8a5b12] font-bold mt-0.5">•</span>
              Full platform services will resume immediately upon institutional reactivation
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2.5">
          <GlassButton
            variant="primary"
            size="lg"
            onClick={handleContactSupport}
            icon={<Mail className="w-4 h-4" />}
            className="w-full"
          >
            Contact SAHAJ Support
          </GlassButton>
          <GlassButton
            variant="secondary"
            size="md"
            onClick={handleLogout}
            className="w-full"
          >
            <span>Sign Out</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
