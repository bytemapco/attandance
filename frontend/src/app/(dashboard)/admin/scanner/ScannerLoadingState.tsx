"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

export default function ScannerLoadingState(): React.ReactElement {
  return (
    <GlassCard className="py-16">
      <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
        <Loader2 size={20} className="mb-4 animate-spin text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-semibold text-foreground">Scanning attendance</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Looking for irregular absence patterns. This can take a few seconds.
        </p>
      </div>
    </GlassCard>
  );
}
