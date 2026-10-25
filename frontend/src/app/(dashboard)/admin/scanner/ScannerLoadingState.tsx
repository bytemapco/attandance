"use client";

import React from "react";
import GlassCard from "@/components/ui/GlassCard";

export default function ScannerLoadingState(): React.ReactElement {
  return (
    <GlassCard className="flex flex-col items-center justify-center py-20 text-center bg-card border-border/80">
      {/* Apple-style Radar Pulse */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="h-16 w-16 rounded-full border border-foreground/10 animate-ping" />
        <div className="absolute h-10 w-10 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
        <div className="h-4 w-4 rounded-full bg-foreground" />
      </div>

      <h4 className="text-sm font-semibold text-foreground">
        Analyzing Attendance Vectors
      </h4>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
        Computing isolation trees and statistical divergence across student cohorts...
      </p>

      {/* Progress Telemetry Steps */}
      <div className="mt-6 flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-foreground animate-pulse" />
        <span className="text-[11px] font-mono text-muted-foreground">
          Evaluating weekly session logs
        </span>
      </div>
    </GlassCard>
  );
}
