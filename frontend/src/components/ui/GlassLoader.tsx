"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GlassLoaderProps {
  text?: string;
  className?: string;
}

export default function GlassLoader({ text = "Loading records...", className = "" }: GlassLoaderProps): React.ReactElement {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 gap-3", className)}>
      <Loader2 size={26} className="text-[#28363b] animate-spin" />
      <p className="text-xs font-semibold text-[#526f78] tracking-wide">{text}</p>
    </div>
  );
}
