"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GlassLoaderProps {
  text?: string;
  className?: string;
}

export default function GlassLoader({ text = "Loading...", className = "" }: GlassLoaderProps): React.ReactElement {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 gap-3", className)}>
      <Loader2 size={28} className="text-primary animate-spin" />
      <p className="text-xs font-medium text-muted-foreground">{text}</p>
    </div>
  );
}
