"use client";

import React, { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import useSWR from "swr";
import { getApiErrorMessage } from "@/lib/api";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import DeviceChangeTable from "@/components/teacher/DeviceChangeTable";
import { toast } from "react-hot-toast";
import type { DeviceChangeRequest } from "@/types/models";

const NO_REQUESTS: DeviceChangeRequest[] = [];

export default function DeviceChangesPage(): React.ReactElement {
  const { data, error, isLoading: loading, isValidating: refreshing, mutate } = useSWR<DeviceChangeRequest[]>(
    "/teacher/device-changes/pending"
  );
  const requests = Array.isArray(data) ? data : NO_REQUESTS;
  const refresh = (): void => void mutate();

  useEffect(() => {
    if (error) toast.error(getApiErrorMessage(error, "Failed to load device change requests"));
  }, [error]);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
      <PageHeader
        title="Device change requests"
        description="Review student requests to update their registered attendance device."
        className="mb-0"
        actions={
          <Button
            variant="secondary"
            icon={<RefreshCw size={14} />}
            loading={loading || refreshing}
            onClick={refresh}
          >
            Refresh
          </Button>
        }
      />

      <div className="relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-64 border rounded-lg bg-card border-border">
            <RefreshCw size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DeviceChangeTable requests={requests} onActionComplete={refresh} />
        )}
      </div>
    </div>
  );
}
