"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassLoader from "@/components/ui/GlassLoader";
import OnboardingWizard from "@/components/admin/onboarding/OnboardingWizard";

function WizardFromQuery(): React.ReactElement {
  const step = useSearchParams().get("step");
  return <OnboardingWizard initialStepId={step} />;
}

export default function AdminSetupPage(): React.ReactElement {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <GlassBreadcrumb className="mb-2 shrink-0" items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Setup" }]} />
      <GlassPageHeader className="mb-3 shrink-0" title="Set up your institution" />
      <Suspense fallback={<div className="flex min-h-0 flex-1 items-center justify-center"><GlassLoader /></div>}>
        <WizardFromQuery />
      </Suspense>
    </div>
  );
}
