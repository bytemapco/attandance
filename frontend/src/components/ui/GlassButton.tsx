"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "accent";
export type ButtonSize = "sm" | "md" | "lg";

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[#28363b] text-white hover:bg-[#1f2b2f] border-transparent shadow-xs",
  secondary: "bg-card text-[#202b30] border-[#e3e1dc] hover:bg-secondary hover:border-[#d4d0c8] shadow-xs",
  danger: "bg-[#b54242] text-white hover:bg-[#9a3838] border-transparent shadow-xs",
  ghost: "bg-transparent text-[#526f78] hover:bg-secondary hover:text-[#202b30] border-transparent",
  accent: "bg-[#c98260] text-[#202b30] hover:bg-[#b97352] font-semibold border-transparent shadow-xs",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-9 px-4 text-sm rounded-md",
  lg: "h-10 px-5 text-sm font-semibold rounded-lg",
};

export default function GlassButton({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: GlassButtonProps): React.ReactElement {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 border font-medium transition-all duration-150 outline-none select-none cursor-pointer",
        "focus-visible:ring-2 focus-visible:ring-[#526f78] focus-visible:ring-offset-2",
        "active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin text-current" /> : icon}
      {children}
    </button>
  );
}
