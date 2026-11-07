"use client";

import React from "react";
import { Database, Zap, HardDrive, Mail, Cpu } from "lucide-react";
import Card from "@/components/ui/Card";
import type { PlatformHealth, ServiceHealthItem } from "@/types/tenant";

interface SystemServicesGridProps {
  health: PlatformHealth;
}

type ServiceKey = keyof PlatformHealth["services"];

const SERVICES: { key: ServiceKey; name: string; icon: React.ReactNode; describe: (details: Record<string, unknown> | null) => string }[] = [
  {
    key: "postgresql",
    name: "PostgreSQL database",
    icon: <Database size={17} />,
    describe: (d) => (d?.version ? `Version ${String(d.version)}` : ""),
  },
  {
    key: "redis_cache",
    name: "Redis cache",
    icon: <Zap size={17} />,
    describe: (d) => (d?.clients !== undefined ? `${String(d.clients)} connected clients` : ""),
  },
  {
    key: "object_storage",
    name: "File storage (S3)",
    icon: <HardDrive size={17} />,
    describe: (d) => (d?.bucket ? `Bucket ${String(d.bucket)}` : d?.note ? String(d.note) : ""),
  },
  {
    key: "email_worker",
    name: "E-mail worker",
    icon: <Mail size={17} />,
    describe: (d) => (d?.jobs_waiting !== undefined ? `${String(d.jobs_waiting)} waiting` : ""),
  },
  {
    key: "ai_hardware",
    name: "AI compute",
    icon: <Cpu size={17} />,
    describe: (d) => (d?.device ? String(d.device).replace(/^\/device:/, "") : ""),
  },
];

function StatusBadge({ status }: { status: ServiceHealthItem["status"] }): React.ReactElement {
  const styles = {
    healthy: { label: "Operational", classes: "text-success bg-success-soft border-success-border", dot: "bg-success" },
    warning: { label: "Degraded", classes: "text-warning bg-warning-soft border-warning-border", dot: "bg-warning" },
    down: { label: "Offline", classes: "text-destructive bg-destructive-soft border-destructive-border", dot: "bg-destructive" },
    not_configured: { label: "Not configured", classes: "text-muted-foreground bg-secondary border-border", dot: "bg-muted-foreground" },
  } as const;
  const style = styles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <span>{style.label}</span>
    </span>
  );
}

export default function SystemServicesGrid({ health }: SystemServicesGridProps): React.ReactElement {
  const healthy = SERVICES.filter(({ key }) => health.services[key].status === "healthy").length;

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60 bg-muted/20 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground">Infrastructure services</h3>
        <span className="text-xs text-muted-foreground">
          {healthy} of {SERVICES.length} operational
        </span>
      </div>

      <div className="divide-y divide-border/40">
        {SERVICES.map((service) => {
          const item = health.services[service.key];
          const note = service.describe(item.details);
          return (
            <div key={service.key} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-secondary border border-border text-muted-foreground shrink-0">{service.icon}</div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{service.name}</p>
                  {note ? <p className="text-xs text-muted-foreground truncate">{note}</p> : null}
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pl-11 sm:pl-0">
                <span className="text-xs font-mono tabular-nums text-muted-foreground">
                  {item.latency_ms != null ? `${item.latency_ms} ms` : "—"}
                </span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
