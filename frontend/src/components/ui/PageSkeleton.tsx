import React from "react";
import { cn } from "@/lib/utils";
import { ContentSkeleton } from "./Skeleton";

export interface PageSkeletonProps {
  text?: string;
  className?: string;
}

export default function PageSkeleton({ text = "Loading records...", className = "" }: PageSkeletonProps): React.ReactElement {
  return (
    <div className={cn("w-full py-3", className)} role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{text}</span>
      <ContentSkeleton />
    </div>
  );
}
