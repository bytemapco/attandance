"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface GlassBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-red-50 text-red-800 border-red-200",
  info: "bg-sky-50 text-sky-800 border-sky-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function GlassBadge({
  variant,
  children,
  className = "",
}: GlassBadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        badgeVariantClasses[variant] || badgeVariantClasses.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  Present: "success",
  Approved: "success",
  Flagged: "warning",
  Pending: "warning",
  Absent: "danger",
  Rejected: "danger",
  Active: "info",
  Inactive: "neutral",
  Normal: "neutral",
};

export function statusToBadgeVariant(status: string): BadgeVariant {
  return STATUS_VARIANT_MAP[status] || "neutral";
}
