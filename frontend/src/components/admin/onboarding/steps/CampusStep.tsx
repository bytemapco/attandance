"use client";

import React from "react";
import CampusLocationCard from "@/components/admin/settings/CampusLocationCard";
import type { StepProps } from "./stepProps";

export default function CampusStep({ refresh, registerContinueAction }: StepProps): React.ReactElement {
  return <CampusLocationCard onSaved={refresh} onContinueReady={registerContinueAction} />;
}
