"use client";

import React from "react";
import { ScanSearch } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

interface ScannerEmptyStateProps {
  onRunScan: () => void;
  loading: boolean;
}

export default function ScannerEmptyState({
  onRunScan,
  loading,
}: ScannerEmptyStateProps): React.ReactElement {
  return (
    <GlassCard className="flex flex-col items-center justify-center py-20 px-6 text-center bg-card border-border/80">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-foreground mb-4">
        <ScanSearch size={26} />
      </div>

      <h3 className="text-base font-semibold text-foreground">
        Ready to Scan
      </h3>

      <p className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
        Select a sensitivity level above and start the scan to flag irregular absence patterns.
      </p>

      <button
        type="button"
        disabled={loading}
        onClick={onRunScan}
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
      >
        <ScanSearch size={14} />
        <span>Run Scan</span>
      </button>
    </GlassCard>
  );
}
