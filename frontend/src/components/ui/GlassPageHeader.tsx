"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface GlassPageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function GlassPageHeader({
  title,
  description,
  subtitle,
  actions,
  className = "",
}: GlassPageHeaderProps): React.ReactElement {
  const text = description || subtitle;

  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#28363b] leading-tight">
          {title}
        </h1>
        {text && (
          <p className="text-xs sm:text-sm font-normal text-[#526f78] mt-1 leading-normal max-w-2xl">
            {text}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
}
