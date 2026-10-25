"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function GlassInput({
  label,
  error,
  icon,
  id,
  type = "text",
  className = "",
  disabled,
  ...props
}: GlassInputProps): React.ReactElement {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative w-full">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center justify-center">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          type={resolvedType}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors",
            "text-foreground placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
            icon && "pl-9",
            isPassword && "pr-9",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-0.5 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-destructive mt-0.5">{error}</p>}
    </div>
  );
}
