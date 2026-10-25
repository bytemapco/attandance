"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import GlassButton from "./GlassButton";
import { cn } from "@/lib/utils";

export interface GlassErrorStateProps {
  title?: string;
  message?: string;
  details?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function GlassErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading this data. Please try again.",
  details,
  retryLabel = "Try Again",
  onRetry,
  className = "",
}: GlassErrorStateProps): React.ReactElement {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center shadow-sm backdrop-blur-sm",
        className
      )}
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle size={24} aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{message}</p>
      {details && (
        <pre className="mt-3 max-w-md mx-auto overflow-x-auto rounded-lg bg-card/60 p-2.5 text-xs text-muted-foreground border border-border text-left font-mono">
          {details}
        </pre>
      )}
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={onRetry}
            icon={<RefreshCw size={14} className="transition-transform active:rotate-180" />}
          >
            {retryLabel}
          </GlassButton>
        </div>
      )}
    </div>
  );
}

export default GlassErrorState;

