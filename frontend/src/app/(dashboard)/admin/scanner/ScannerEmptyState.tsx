"use client";

import React from "react";
import { ScanSearch } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface ScannerEmptyStateProps {
  onRunScan: () => void;
  loading: boolean;
}

export default function ScannerEmptyState({
  onRunScan,
  loading,
}: ScannerEmptyStateProps): React.ReactElement {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <ScanSearch size={22} className="mb-3 text-muted-foreground" aria-hidden />
      <h3 className="text-base font-semibold text-foreground">No scan yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Choose a sensitivity level above, then run a scan to flag irregular absence patterns.
      </p>
      <Button className="mt-5" disabled={loading} onClick={onRunScan} icon={<ScanSearch size={14} />}>
        Run scan
      </Button>
    </Card>
  );
}
