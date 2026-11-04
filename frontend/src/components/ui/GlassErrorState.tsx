"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
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
  title = "Unable to load data",
  message = "A system issue prevented this information from displaying. Please try again.",
  details,
  retryLabel = "Try Again",
  onRetry,
  className = "",
}: GlassErrorStateProps): React.ReactElement {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-destructive-border bg-destructive-soft/60 p-8 text-center",
        className
      )}
    >
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-destructive-soft text-destructive border border-destructive-border">
        <AlertCircle size={22} aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
      <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{message}</p>
      {details && (
        <pre className="mt-3 max-w-md mx-auto overflow-x-auto rounded-lg bg-card p-2.5 text-xs text-muted-foreground border border-border text-left font-mono">
          {details}
        </pre>
      )}
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={onRetry}
            icon={<RefreshCw size={13} />}
          >
            {retryLabel}
          </GlassButton>
        </div>
      )}
    </div>
  );
}

export default GlassErrorState;
