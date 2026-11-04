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
  success: "bg-success-soft text-success border-success-border",
  warning: "bg-warning-soft text-warning border-warning-border",
  danger: "bg-destructive-soft text-destructive border-destructive-border",
  info: "bg-info-soft text-info border-info-border",
  neutral: "bg-secondary text-muted-foreground border-border",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors select-none",
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
