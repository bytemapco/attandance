import React from "react";
import { ContentSkeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading(): React.ReactElement {
  return (
    <div className="w-full py-3" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading page</span>
      <ContentSkeleton />
    </div>
  );
}
