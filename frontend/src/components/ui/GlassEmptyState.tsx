"use client";

import React from "react";
import { Inbox } from "lucide-react";
import GlassButton from "./GlassButton";
import { cn } from "@/lib/utils";

export interface GlassEmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function GlassEmptyState({
  title = "No data yet",
  message = "There is nothing to display right now.",
  actionLabel,
  onAction,
  className = "",
}: GlassEmptyStateProps): React.ReactElement {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-12 text-center shadow-sm", className)}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Inbox size={24} />
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
