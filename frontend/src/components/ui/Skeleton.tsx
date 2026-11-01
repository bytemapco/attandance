import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className = "" }: { className?: string }): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse motion-reduce:animate-none rounded-md bg-secondary", className)}
    />
  );
}

export function ContentSkeleton(): React.ReactElement {
  return (
    <div aria-hidden="true" className="w-full space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 max-w-[75%] rounded-lg" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="space-y-3 rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-32 max-w-full" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card p-4">
        <Skeleton className="mb-4 h-5 w-40" />
        <div className="space-y-4">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="hidden h-7 w-20 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
