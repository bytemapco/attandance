"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
  glowColor?: string;
}

const padMap: Record<"none" | "sm" | "md" | "lg", string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export default function GlassCard({
  children,
  className = "",
  hoverable = false,
  padding = "md",
  onClick,
}: GlassCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground transition-all duration-200",
        padMap[padding],
        hoverable && "hover:border-accent/60",
        onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {children}
    </div>
  );
}
