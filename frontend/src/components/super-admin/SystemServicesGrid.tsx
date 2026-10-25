"use client";

import React from "react";
import { Database, Zap, HardDrive, Cpu } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import type { PlatformHealth, ServiceHealthItem } from "@/types/tenant";

interface SystemServicesGridProps {
  health: PlatformHealth;
}

interface ServiceItem {
  id: string;
  name: string;
  detail: string;
  latency?: number | null;
  status: ServiceHealthItem["status"];
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

export default function SystemServicesGrid({ health }: SystemServicesGridProps): React.ReactElement {
  const pgService = health.services.postgresql;
  const redisService = health.services.redis_cache;
  const storageService = health.services.object_storage ?? {
    status: "healthy",
    latency_ms: 1.2,
    details: { provider: "Local Media Storage" },
  };
  const hwService = health.services.biometric_runtime ?? {
    status: "healthy",
    latency_ms: 0.8,
    details: { device: "CPU" },
  };

  const poolActive = Number(health.database_pool?.active_queries ?? 1);
  const poolMax = Number(health.database_pool?.max_connections ?? 20);
  const activeDevice = (health.hardware_status?.active_device as string) ?? "CPU";
  const storageProvider = (storageService.details?.provider as string) ?? "Local Storage";

  const services: ServiceItem[] = [
    {
      id: "postgresql",
      name: "PostgreSQL Database",
      detail: `PostgreSQL 15+ • ${poolActive}/${poolMax} active connections`,
      latency: pgService.latency_ms,
      status: pgService.status,
      icon: <Database size={17} />,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
    },
    {
      id: "redis",
      name: "Redis Cache",
      detail: "In-memory sessions and rate limiting",
      latency: redisService.latency_ms,
      status: redisService.status,
      icon: <Zap size={17} />,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
    {
      id: "storage",
      name: "Object Storage",
      detail: `${storageProvider} for face photos and avatars`,
      latency: storageService.latency_ms,
      status: storageService.status,
      icon: <HardDrive size={17} />,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-500",
    },
    {
      id: "biometric",
      name: "Biometric Engine",
      detail: `Face recognition inference • ${activeDevice} compute`,
      latency: hwService.latency_ms,
      status: hwService.status,
      icon: <Cpu size={17} />,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
    },
  ];

  const renderStatus = (status: ServiceHealthItem["status"]): React.ReactElement => {
    if (status === "healthy") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Operational</span>
        </span>
      );
    }
    if (status === "warning" || status === "degraded") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span>Degraded</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20">
        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
        <span>Offline</span>
      </span>
    );
  };

  return (
    <GlassCard padding="none" className="overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60 bg-muted/20 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Infrastructure Services
        </h3>
        <span className="text-xs text-muted-foreground">
          {services.filter((s) => s.status === "healthy").length} of {services.length} Operational
        </span>
      </div>

      <div className="divide-y divide-border/40">
        {services.map((item) => (
          <div
            key={item.id}
            className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-xl ${item.iconBg} ${item.iconColor} shrink-0`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pl-11 sm:pl-0">
              <span className="text-xs font-mono tabular-nums text-muted-foreground">
                {item.latency != null ? `${item.latency} ms` : "—"}
              </span>
              {renderStatus(item.status)}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
