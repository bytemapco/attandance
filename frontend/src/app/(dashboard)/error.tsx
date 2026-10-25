"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    // Optionally log error digest
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 sm:p-8">
      <div className="text-center max-w-md w-full rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="p-3 rounded-2xl bg-destructive/10 text-destructive inline-flex mb-4">
          <AlertTriangle size={36} aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
          Something went wrong
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">
          {error.message || "Could not load this page. Please try again."}
        </p>
        {error.digest && (
          <p className="text-[11px] text-muted-foreground font-mono mb-6 bg-muted/60 py-1 px-2.5 rounded border border-border inline-block">
            Code: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <GlassButton
            variant="primary"
            size="md"
            icon={<RefreshCw size={14} />}
            onClick={reset}
            className="w-full sm:w-auto"
          >
            Try Again
          </GlassButton>
          <Link
            href="/admin/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-border bg-secondary/50 text-foreground font-semibold text-xs hover:bg-secondary transition-all cursor-pointer"
          >
            <LayoutDashboard size={14} />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
