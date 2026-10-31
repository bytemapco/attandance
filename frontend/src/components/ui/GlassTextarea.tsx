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
        <label htmlFor={textareaId} className="text-xs sm:text-sm font-semibold text-[#202b30]">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        disabled={disabled}
        className={cn(
          "flex min-h-[90px] w-full rounded-md border border-[#e3e1dc] bg-card px-3 py-2 text-sm shadow-2xs transition-colors",
          "text-[#202b30] placeholder:text-[#718087]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526f78]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#eeece7]",
          error && "border-[#b54242] focus-visible:ring-[#b54242]",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-medium text-[#b54242] mt-0.5">{error}</p>}
    </div>
  );
}
