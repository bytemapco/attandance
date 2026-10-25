"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import GlassButton from "@/components/ui/GlassButton";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    // Optionally log error identifier or non-sensitive details
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-background text-foreground relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md text-center z-10">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 shadow-lg backdrop-blur-xs">
          <div className="inline-flex p-3 rounded-2xl bg-destructive/10 text-destructive mb-6 shadow-2xs">
            <AlertTriangle size={36} aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
            Something went wrong
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
            {error.message || "Something went wrong while processing your request."}
          </p>

          {error.digest && (
            <p className="text-[11px] text-muted-foreground font-mono mb-6 bg-muted/50 py-1 px-2.5 rounded border border-border inline-block">
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
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-border bg-secondary/50 text-foreground font-semibold text-xs hover:bg-secondary transition-all cursor-pointer"
            >
              <Home size={14} />
              <span>Go Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
