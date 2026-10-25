"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Smartphone, RefreshCw } from "lucide-react";
import api, { getApiErrorMessage } from "@/lib/api";
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
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Smartphone size={24} />
            </div>
            Device Change Requests
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-2xl leading-relaxed">
            Review student requests to update their registered attendance device.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchRequests(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-muted text-foreground rounded-lg transition-colors border border-border shadow-xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing || loading ? "animate-spin text-primary" : "text-primary"} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      <div className="relative z-10">
        {loading ? (
          <div className="flex items-center justify-center h-64 border rounded-2xl bg-card border-border">
            <RefreshCw size={32} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DeviceChangeTable requests={requests} onActionComplete={() => void fetchRequests(true)} />
        )}
      </div>
    </div>
  );
}
