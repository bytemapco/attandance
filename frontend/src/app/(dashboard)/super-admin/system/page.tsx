"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import { superAdminService } from "@/services/superAdminService";
import { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import SystemMetricsGrid from "@/components/super-admin/SystemMetricsGrid";
import SystemServicesGrid from "@/components/super-admin/SystemServicesGrid";
import type { PlatformHealth } from "@/types/tenant";

export default function PlatformHealthPage(): React.ReactElement {
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = useCallback(async (showToast = false): Promise<void> => {
    try {
      if (showToast) setRefreshing(true);
      const data = await superAdminService.getSystemHealth();
      setHealth(data);
      if (showToast) {
        toast.success("Status updated");
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to retrieve status"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchHealth();
  }, [fetchHealth]);

  const isHealthy = health?.status === "healthy";

  return (
    <div className="space-y-5 max-w-5xl">
      <GlassBreadcrumb
        items={[
          { label: "Dashboard", href: "/super-admin/dashboard" },
          { label: "System Status" },
        ]}
      />

      <GlassPageHeader
        title="System Status"
        description="Service health and diagnostics."
        actions={
          <GlassButton
            variant="secondary"
            onClick={() => void fetchHealth(true)}
            disabled={refreshing}
            className="gap-1.5 text-xs h-9 px-3"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            <span>Refresh</span>
          </GlassButton>
        }
      />

      {loading || !health ? (
        <div className="space-y-4" role="status" aria-label="Loading system health" aria-busy="true">
          <Skeleton className="h-16 rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-lg border border-border bg-card p-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
          <div className="space-y-4 rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-44 w-full rounded-lg" />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Status Header Strip */}
          <GlassCard className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  isHealthy
                    ? "bg-success ring-4 ring-success/20"
                    : "bg-warning ring-4 ring-warning/20"
                }`}
              />
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {isHealthy ? "All services operational" : "Service degradation detected"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Updated at{" "}
                  {new Date(health.timestamp).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Vitals KPI Strip */}
          <SystemMetricsGrid health={health} />

          {/* Core Services Table */}
          <SystemServicesGrid health={health} />
        </div>
      )}
    </div>
  );
}
