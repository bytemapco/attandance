"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function GlassTextarea({
  label,
  error,
  id,
  className = "",
  disabled,
  ...props
}: GlassTextareaProps): React.ReactElement {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        disabled={disabled}
        className={cn(
          "flex min-h-[90px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-medium text-destructive mt-0.5">{error}</p>}
    </div>
  );
}
