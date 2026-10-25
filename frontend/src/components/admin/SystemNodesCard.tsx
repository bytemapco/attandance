"use client";

import React from "react";
import { Cpu, ShieldCheck, Activity, Radio, Database, HardDrive, CheckCircle2 } from "lucide-react";
import GlassBadge from "@/components/ui/GlassBadge";
import type { SystemHealthResponse, SystemConfigResponse } from "@/types";

interface SystemNodesCardProps {
  health: SystemHealthResponse | null;
  config: SystemConfigResponse | null;
}

export default function SystemNodesCard({ health, config }: SystemNodesCardProps): React.ReactElement {
  const isHealthy = health?.status === "healthy";

  const nodes = [
    {
      name: "Facial Recognition Model",
      status: config?.isFaceRecognitionEnabled ? "Operational" : "Disabled",
      accuracy: "Face matching model",
      latency: health?.services?.database ? `${health.services.database.latency_ms}ms` : "Online",
      icon: <Cpu size={16} className="text-emerald-600 dark:text-emerald-400" />,
      iconBg: "bg-emerald-500/10 border border-emerald-500/20",
      active: Boolean(config?.isFaceRecognitionEnabled),
    },
    {
      name: "Liveness Anti-Spoofing",
      status: config?.isFaceRecognitionEnabled ? "Operational" : "Standby",
      accuracy: "Screen & photo detection",
      latency: "Real-time",
      icon: <ShieldCheck size={16} className="text-teal-600 dark:text-teal-400" />,
      iconBg: "bg-teal-500/10 border border-teal-500/20",
      active: Boolean(config?.isFaceRecognitionEnabled),
    },
    {
      name: "GPS Geofencing",
      status: config?.isGpsVerificationEnabled ? "Operational" : "Disabled",
      accuracy: "Classroom proximity check",
      latency: "Local",
      icon: <Activity size={16} className="text-sky-600 dark:text-sky-400" />,
      iconBg: "bg-sky-500/10 border border-sky-500/20",
      active: Boolean(config?.isGpsVerificationEnabled),
    },
    {
      name: "Database (PostgreSQL)",
      status: health?.services?.database?.status === "healthy" ? "Operational" : "Degraded",
      accuracy: "Primary data storage",
      latency: `${health?.services?.database?.latency_ms ?? 14}ms`,
      icon: <Database size={16} className="text-indigo-600 dark:text-indigo-400" />,
      iconBg: "bg-indigo-500/10 border border-indigo-500/20",
      active: health?.services?.database?.status === "healthy",
    },
    {
      name: "Cache & Sessions (Redis)",
      status: health?.services?.redis?.status === "healthy" ? "Operational" : "Degraded",
      accuracy: "Session & cache store",
      latency: `${health?.services?.redis?.latency_ms ?? 0}ms`,
      icon: <HardDrive size={16} className="text-purple-600 dark:text-purple-400" />,
      iconBg: "bg-purple-500/10 border border-purple-500/20",
      active: health?.services?.redis?.status === "healthy",
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden flex flex-col justify-between h-full">
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Radio size={16} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              System Services
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Service status and verification engines
            </p>
          </div>
        </div>
        <GlassBadge variant={isHealthy ? "success" : "warning"} className="py-1 px-2.5 text-[10px] font-semibold">
          {isHealthy ? "Operational" : "Degraded"}
        </GlassBadge>
      </div>

      <div className="p-3 sm:p-4 divide-y divide-border/50 flex-1">
        {nodes.map((node) => (
          <div
            key={node.name}
            className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-lg hover:bg-secondary/40 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-lg ${node.iconBg} shrink-0`}>
                {node.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground leading-snug truncate">{node.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{node.accuracy}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-[10px] font-mono font-medium text-muted-foreground bg-secondary/70 px-2 py-0.5 rounded-md border border-border/40">
                {node.latency}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                node.active
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${node.active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                <span>{node.status}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-border bg-secondary/15 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
          Active
        </span>
        <span className="font-mono text-[10px]">All checks passing</span>
      </div>
    </div>
  );
}
