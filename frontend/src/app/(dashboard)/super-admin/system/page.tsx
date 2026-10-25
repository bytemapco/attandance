"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

import { superAdminService } from "@/lib/services/superAdminService";
import { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import SystemMetricsGrid from "@/components/super-admin/SystemMetricsGrid";
import SystemServicesGrid from "@/components/super-admin/SystemServicesGrid";
import type { PlatformHealth } from "@/types/tenant";

export default function PlatformHealthPage(): React.ReactElement {
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopyDiagnostics = async (): Promise<void> => {
    if (!health) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(health, null, 2));
      setCopied(true);
      toast.success("Diagnostics copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const isHealthy = health?.status === "healthy";

  return (
    <div className="space-y-5 max-w-5xl animate-fade-in-up">
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
          <div className="flex items-center gap-2">
            <GlassButton
              variant="ghost"
              onClick={() => void handleCopyDiagnostics()}
              disabled={!health}
              className="gap-1.5 text-xs h-9 px-3"
              title="Copy details"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </GlassButton>

            <GlassButton
              variant="secondary"
              onClick={() => void fetchHealth(true)}
              disabled={refreshing}
              className="gap-1.5 text-xs h-9 px-3"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              <span>Refresh</span>
            </GlassButton>
          </div>
        }
      />

      {loading || !health ? (
        <div className="space-y-4">
          <div className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-card border border-border animate-pulse" />
            ))}
          </div>
          <div className="h-56 rounded-2xl bg-card border border-border animate-pulse" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Status Header Strip */}
          <GlassCard className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  isHealthy
                    ? "bg-emerald-500 ring-4 ring-emerald-500/20"
                    : "bg-amber-500 ring-4 ring-amber-500/20"
                }`}
              />
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {isHealthy ? "All systems operating normally" : "Service advisory in effect"}
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

            <span className="text-xs font-mono text-muted-foreground pl-5.5 sm:pl-0">
              {isHealthy ? "4 of 4 services operational" : "Review degraded services below"}
            </span>
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
