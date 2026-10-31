"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface GlassBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  success: "bg-[#e8f3ed] text-[#247653] border-[#c6e2d3]",
  warning: "bg-[#fbf1df] text-[#8a5b12] border-[#f2deba]",
  danger: "bg-[#f9eaea] text-[#b54242] border-[#f0c9c9]",
  info: "bg-[#eaf2f6] text-[#306b8a] border-[#c5dce8]",
  neutral: "bg-[#eeece7] text-[#526f78] border-[#e3e1dc]",
};

export default function GlassBadge({
  variant,
  children,
  className = "",
  icon,
}: GlassBadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors select-none",
        badgeVariantClasses[variant] || badgeVariantClasses.neutral,
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  Present: "success",
  Approved: "success",
  ACTIVE: "success",
  Flagged: "warning",
  Pending: "warning",
  TRIAL: "warning",
  Absent: "danger",
  Rejected: "danger",
  SUSPENDED: "danger",
  Active: "info",
  PROVISIONING: "info",
  Inactive: "neutral",
  Normal: "neutral",
};

export function statusToBadgeVariant(status: string): BadgeVariant {
  return STATUS_VARIANT_MAP[status] || "neutral";
}
