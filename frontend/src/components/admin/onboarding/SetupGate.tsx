"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSetupStatus } from "@/hooks/useSetupStatus";
import SetupChecklistCard from "./SetupChecklistCard";

const REDIRECTED_KEY = "sas-setup-redirected";

/**
 * Sends a tenant admin to the setup wizard once per browser session while onboarding is unfinished,
 * then shows the progress card on the dashboard. Renders nothing once setup is complete.
 */
export default function SetupGate(): React.ReactElement | null {
  const router = useRouter();
  const { status } = useSetupStatus();

  useEffect(() => {
    if (!status || status.completed) return;
    try {
      if (sessionStorage.getItem(REDIRECTED_KEY)) return;
      sessionStorage.setItem(REDIRECTED_KEY, "1");
    } catch {
      return;
    }
    router.replace("/admin/onboarding");
  }, [status, router]);

  if (!status || status.completed) return null;
  // "Finish later" lands here: the card keeps the next action one click away.
  return <SetupChecklistCard status={status} />;
}
