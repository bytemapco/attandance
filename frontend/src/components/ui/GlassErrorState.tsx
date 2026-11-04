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
  message = "This information could not be loaded. Try again.",
  details,
  retryLabel = "Try again",
  onRetry,
  className = "",
}: GlassErrorStateProps): React.ReactElement {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-destructive-border bg-destructive-soft px-6 py-10 text-center",
        className
      )}
    >
      <AlertCircle size={20} className="mx-auto mb-3 text-destructive" aria-hidden="true" />
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{message}</p>
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
