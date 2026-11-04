"use client";

import React, { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassButton from "@/components/ui/GlassButton";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import DeviceChangeTable from "@/components/teacher/DeviceChangeTable";
import { toast } from "react-hot-toast";
import type { DeviceChangeRequest } from "@/types/models";

export default function DeviceChangesPage(): React.ReactElement {
  const [requests, setRequests] = useState<DeviceChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async (isSilent = false): Promise<void> => {
    if (isSilent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await api.get<DeviceChangeRequest[]>("/teacher/device-changes/pending");
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to load device change requests"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests(false);
  }, [fetchRequests]);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
      <GlassPageHeader
        title="Device change requests"
        description="Review student requests to update their registered attendance device."
        className="mb-0"
        actions={
          <GlassButton
            variant="secondary"
            icon={<RefreshCw size={14} />}
            loading={loading || refreshing}
            onClick={() => void fetchRequests(true)}
          >
            Refresh
          </GlassButton>
        }
      />

      <div className="relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-64 border rounded-lg bg-card border-border">
            <RefreshCw size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DeviceChangeTable requests={requests} onActionComplete={() => void fetchRequests(true)} />
        )}
      </div>
    </div>
  );
}
