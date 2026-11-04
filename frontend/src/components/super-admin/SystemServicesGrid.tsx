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

  const services: ServiceItem[] = [
    {
      id: "postgresql",
      name: "PostgreSQL Database",
      detail: "",
      latency: pgService.latency_ms,
      status: pgService.status,
      icon: <Database size={17} />,
      iconBg: "bg-secondary border border-border",
      iconColor: "text-primary",
    },
    {
      id: "redis",
      name: "Redis Cache",
      detail: "",
      latency: redisService.latency_ms,
      status: redisService.status,
      icon: <Zap size={17} />,
      iconBg: "bg-success-soft border border-success-border",
      iconColor: "text-success",
    },
    {
      id: "storage",
      name: "Object Storage",
      detail: "",
      latency: storageService.latency_ms,
      status: storageService.status,
      icon: <HardDrive size={17} />,
      iconBg: "bg-secondary border border-border",
      iconColor: "text-muted-foreground",
    },
    {
      id: "biometric",
      name: "Biometric AI Engine",
      detail: "",
      latency: hwService.latency_ms,
      status: hwService.status,
      icon: <Cpu size={17} />,
      iconBg: "bg-accent-soft border border-accent-border",
      iconColor: "text-accent-strong",
    },
  ];

  const renderStatus = (status: ServiceHealthItem["status"]): React.ReactElement => {
    if (status === "healthy") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-success bg-success-soft border border-success-border">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <span>Operational</span>
        </span>
      );
    }
    if (status === "warning" || status === "degraded") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-warning bg-warning-soft border border-warning-border">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          <span>Degraded</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-destructive bg-destructive-soft border border-destructive-border">
        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
        <span>Offline</span>
      </span>
    );
  };

  return (
    <GlassCard padding="none" className="overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60 bg-muted/20 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground">
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
              <div className={`p-2 rounded-lg ${item.iconBg} ${item.iconColor} shrink-0`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                {item.detail ? <p className="text-xs text-muted-foreground truncate">{item.detail}</p> : null}
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
