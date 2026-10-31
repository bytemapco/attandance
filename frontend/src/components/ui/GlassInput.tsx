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
        <label htmlFor={inputId} className="text-xs sm:text-sm font-semibold text-[#202b30]">
          {label}
        </label>
      )}
      <div className="relative w-full">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#526f78] flex items-center justify-center">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          type={resolvedType}
          disabled={disabled}
          className={cn(
            "flex h-9 sm:h-10 w-full rounded-md border border-[#e3e1dc] bg-card px-3 py-1 text-sm shadow-2xs transition-colors",
            "text-[#202b30] placeholder:text-[#718087]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526f78] focus-visible:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#eeece7]",
            icon && "pl-9",
            isPassword && "pr-9",
            error && "border-[#b54242] focus-visible:ring-[#b54242]",
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#526f78] hover:text-[#202b30] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526f78] rounded p-0.5 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-[#b54242] mt-0.5">{error}</p>}
    </div>
  );
}
