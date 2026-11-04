"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans antialiased">
        <div className="w-full max-w-md text-center rounded-lg border border-border bg-card p-8">
          <div className="inline-flex p-3 rounded-lg bg-destructive-soft text-destructive border border-destructive-border mb-5">
            <svg
              className="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-primary mb-2">
            Something went critically wrong
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
            {error.message || "A critical system error occurred. Restarting the session usually resolves this."}
          </p>

          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover transition-all cursor-pointer"
          >
            Restart Application
          </button>
        </div>
      </body>
    </html>
  );
}
