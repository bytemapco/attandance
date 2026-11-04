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
    <div className={cn("rounded-lg border border-border bg-card px-6 py-12 text-center", className)}>
      <div className="mx-auto mb-3 flex justify-center text-muted-foreground" aria-hidden>
        {icon || <FolderOpen size={20} />}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">{message}</p>
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
