"use client";

import React from "react";
import { Server, Database, Zap, Mail } from "lucide-react";
import Card from "@/components/ui/Card";
import type { PlatformHealth } from "@/types/tenant";

interface SystemMetricsGridProps {
  health: PlatformHealth;
}

const UNKNOWN = "Unknown";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [days && `${days}d`, hours && `${hours}h`, `${minutes}m`].filter(Boolean).join(" ");
}

function MetricCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note?: string }): React.ReactElement {
  return (
    <Card className="p-4 flex items-center gap-3.5">
      <div className="p-2.5 rounded-lg bg-secondary text-muted-foreground border border-border shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-lg font-semibold text-foreground truncate">{value}</p>
        {note ? <p className="text-xs text-muted-foreground truncate">{note}</p> : null}
      </div>
    </Card>
  );
}

export default function SystemMetricsGrid({ health }: SystemMetricsGridProps): React.ReactElement {
  const db = health.services.postgresql.details;
  const redis = health.services.redis_cache.details;
  const worker = health.services.email_worker.details;

  const connections =
    typeof db?.connections === "number" && typeof db?.max_connections === "number"
      ? `${db.connections} / ${db.max_connections}`
      : UNKNOWN;
  const memory = typeof redis?.memory_used === "string" ? redis.memory_used : UNKNOWN;
  const queued = typeof worker?.jobs_waiting === "number" ? String(worker.jobs_waiting) : UNKNOWN;
  const workerOnline = worker?.online === true ? "Worker online" : "Worker offline";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard icon={<Server size={18} />} label="API uptime" value={formatUptime(health.server_uptime_seconds)} note="Since the API last started" />
      <MetricCard icon={<Database size={18} />} label="Database connections" value={connections} note="In use / allowed" />
      <MetricCard icon={<Zap size={18} />} label="Cache memory" value={memory} note="Redis" />
      <MetricCard icon={<Mail size={18} />} label="E-mails waiting" value={queued} note={workerOnline} />
    </div>
  );
}
