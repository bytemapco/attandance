"use client";

import React from "react";
import { Server, Database, Zap, Cpu } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
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
      <GlassCard className="p-4 flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
          <Server size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">Uptime</p>
          <p className="text-lg font-bold text-foreground truncate">
            {formatUptime(health.server_uptime_seconds)}
          </p>
        </div>
      </GlassCard>

      {/* DB Connections */}
      <GlassCard className="p-4 flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
          <Database size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">DB Pool</p>
          <p className="text-lg font-bold text-foreground truncate">
            {poolActive} <span className="text-xs font-normal text-muted-foreground">/ {poolMax}</span>
          </p>
        </div>
      </GlassCard>

      {/* Cache Ping */}
      <GlassCard className="p-4 flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
          <Zap size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">Cache Latency</p>
          <p className="text-lg font-bold text-foreground truncate">
            {redisLatency != null ? `${redisLatency} ms` : "0 ms"}
          </p>
        </div>
      </GlassCard>

      {/* Biometric Compute */}
      <GlassCard className="p-4 flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
          <Cpu size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">Biometric Device</p>
          <p className="text-lg font-bold text-foreground truncate">
            {activeDevice}
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
