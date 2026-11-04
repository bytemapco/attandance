"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Button from "@/components/ui/Button";

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
        <div className="rounded-lg border border-border bg-card p-8 sm:p-10">
          <div className="inline-flex p-3 rounded-lg bg-destructive-soft text-destructive border border-destructive-border mb-5">
            <AlertCircle size={32} aria-hidden="true" />
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-primary mb-2">
            This page failed to load
          </h1>

          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
            {error.message || "An unexpected error interrupted this session. Please try reloading."}
          </p>

          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono mb-6 bg-secondary/70 py-1 px-2.5 rounded-sm border border-border inline-block">
              Reference: {error.digest}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Button
              variant="primary"
              size="md"
              icon={<RefreshCw size={14} />}
              onClick={reset}
              className="w-full sm:w-auto"
            >
              Try Again
            </Button>

            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="md"
                icon={<Home size={14} />}
                className="w-full"
              >
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
