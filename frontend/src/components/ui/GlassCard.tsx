"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
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
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (!onClick || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    onClick();
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground",
        padMap[padding],
        (hoverable || onClick) && "transition-colors hover:border-border-strong",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      {children}
    </div>
  );
}
