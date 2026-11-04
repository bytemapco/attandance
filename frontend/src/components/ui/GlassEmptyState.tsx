"use client";

import React from "react";
import { FolderOpen } from "lucide-react";
import GlassButton from "./GlassButton";
import { cn } from "@/lib/utils";

export interface GlassEmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export default function GlassEmptyState({
  title = "No records yet",
  message = "There is nothing to display right now.",
  actionLabel,
  onAction,
  icon,
  className = "",
}: GlassEmptyStateProps): React.ReactElement {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-10 sm:p-14 text-center shadow-xs", className)}>
      <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-muted-foreground border border-border">
        {icon || <FolderOpen size={22} />}
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">{message}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <GlassButton variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </GlassButton>
        </div>
      )}
    </div>
  );
}
