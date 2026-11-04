"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import PageHeader from "@/components/ui/PageHeader";
import PageSkeleton from "@/components/ui/PageSkeleton";
import OnboardingWizard from "@/components/admin/onboarding/OnboardingWizard";

function WizardFromQuery(): React.ReactElement {
  const step = useSearchParams().get("step");
  return <OnboardingWizard initialStepId={step} />;
}

export default function AdminSetupPage(): React.ReactElement {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Breadcrumb className="mb-2 shrink-0" items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Setup" }]} />
      <PageHeader className="mb-3 shrink-0" title="Set up your institution" />
      <Suspense fallback={<div className="flex min-h-0 flex-1 items-center justify-center"><PageSkeleton /></div>}>
        <WizardFromQuery />
      </Suspense>
    </div>
  );
}
