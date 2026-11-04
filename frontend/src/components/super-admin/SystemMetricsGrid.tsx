"use client";

import React from "react";
import { Server, Database, Zap, Cpu } from "lucide-react";
import Card from "@/components/ui/Card";
import type { PlatformHealth } from "@/types/tenant";

interface SystemMetricsGridProps {
  health: PlatformHealth;
}

export default function SystemMetricsGrid({ health }: SystemMetricsGridProps): React.ReactElement {
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    return parts.join(" ") || "< 1m";
  };

  const poolActive = Number(health.database_pool?.active_queries ?? 1);
  const poolMax = Number(health.database_pool?.max_connections ?? 20);
  const redisLatency = health.services.redis_cache?.latency_ms;
  const activeDevice = (health.hardware_status?.active_device as string) ?? "CPU";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Uptime */}
      <Card className="p-4 flex items-center gap-3.5">
        <div className="p-2.5 rounded-lg bg-secondary text-muted-foreground border border-border shrink-0">
          <Server size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">Uptime</p>
          <p className="text-lg font-semibold text-foreground truncate">
            {formatUptime(health.server_uptime_seconds)}
          </p>
        </div>
      </Card>

      {/* DB Connections */}
      <Card className="p-4 flex items-center gap-3.5">
        <div className="p-2.5 rounded-lg bg-secondary text-primary border border-border shrink-0">
          <Database size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">DB Pool</p>
          <p className="text-lg font-semibold text-foreground truncate">
            {poolActive} <span className="text-xs font-normal text-muted-foreground">/ {poolMax}</span>
          </p>
        </div>
      </Card>

      {/* Cache Ping */}
      <Card className="p-4 flex items-center gap-3.5">
        <div className="p-2.5 rounded-lg bg-success-soft text-success border border-success-border shrink-0">
          <Zap size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">Cache Latency</p>
          <p className="text-lg font-semibold text-foreground truncate">
            {redisLatency != null ? `${redisLatency} ms` : "0 ms"}
          </p>
        </div>
      </Card>

      {/* Biometric Compute */}
      <Card className="p-4 flex items-center gap-3.5">
        <div className="p-2.5 rounded-lg bg-accent-soft text-accent-strong border border-accent-border shrink-0">
          <Cpu size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">AI Compute Hardware</p>
          <p className="text-lg font-semibold text-foreground truncate" title={activeDevice}>
            {activeDevice.replace(/^\/device:/, "")}
          </p>
        </div>
      </Card>
    </div>
  );
}
