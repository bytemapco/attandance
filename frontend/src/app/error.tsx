"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
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
      <div className="w-full max-w-md text-center z-10">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-10 shadow-[0_8px_24px_rgba(40,54,59,0.08)]">
          <div className="inline-flex p-3 rounded-2xl bg-destructive-soft text-destructive border border-destructive-border mb-5">
            <AlertCircle size={32} aria-hidden="true" />
          </div>

          <h1 className="text-xl font-bold tracking-tight text-primary mb-2">
            Something unexpected occurred
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
            {error.message || "An unexpected error interrupted this session. Please try reloading."}
          </p>

          {error.digest && (
            <p className="text-[11px] text-muted-foreground font-mono mb-6 bg-secondary/70 py-1 px-2.5 rounded border border-border inline-block">
              Reference: {error.digest}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <GlassButton
              variant="primary"
              size="md"
              icon={<RefreshCw size={14} />}
              onClick={reset}
              className="w-full sm:w-auto"
            >
              Try Again
            </GlassButton>

            <Link href="/" className="w-full sm:w-auto">
              <GlassButton
                variant="secondary"
                size="md"
                icon={<Home size={14} />}
                className="w-full"
              >
                Go Home
              </GlassButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
