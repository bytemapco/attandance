"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-slate-800 border-transparent shadow-sm",
  secondary: "bg-card text-foreground border-border hover:bg-secondary shadow-sm",
  danger: "bg-destructive text-destructive-foreground hover:bg-red-600 border-transparent shadow-sm",
  ghost: "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground border-transparent",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-9 px-4 text-sm rounded-md",
  lg: "h-10 px-5 text-sm font-medium rounded-lg",
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
        "inline-flex items-center justify-center gap-2 border font-medium transition-all duration-150 outline-none select-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
