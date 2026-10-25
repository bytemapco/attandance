"use client";

import React from "react";
import { Eye, AlertTriangle, AlertCircle, Info, Building2 } from "lucide-react";
import type { SuperAdminAuditLog } from "@/types/tenant";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassEmptyState from "@/components/ui/GlassEmptyState";

interface AuditLogTableProps {
  logs: SuperAdminAuditLog[];
  loading: boolean;
  onSelectLog: (log: SuperAdminAuditLog) => void;
}

export default function AuditLogTable({
  logs,
  loading,
  onSelectLog,
}: AuditLogTableProps): React.ReactElement {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <GlassEmptyState
        title="No audit events found"
        message="No security actions or system audit logs match your filter criteria."
      />
    );
  }

  const getSeverityBadge = (sev: string): React.ReactElement => {
    switch (sev) {
      case "CRITICAL":
        return (
          <GlassBadge variant="danger" className="gap-1">
            <AlertCircle size={11} /> CRITICAL
          </GlassBadge>
        );
      case "ERROR":
        return (
          <GlassBadge variant="danger" className="gap-1">
            <AlertCircle size={11} /> ERROR
          </GlassBadge>
        );
      case "WARNING":
        return (
          <GlassBadge variant="warning" className="gap-1">
            <AlertTriangle size={11} /> WARNING
          </GlassBadge>
        );
      case "INFO":
      default:
        return (
          <GlassBadge variant="info" className="gap-1">
            <Info size={11} /> INFO
          </GlassBadge>
        );
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Event Type</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Description & Target</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground text-[11px] font-mono">
                  {new Date(log.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </td>

                <td className="px-4 py-3.5 whitespace-nowrap">
                  {getSeverityBadge(log.severity)}
                </td>

                <td className="px-4 py-3.5">
                  <div className="font-semibold text-foreground font-mono text-[11px]">
                    {log.event_type}
                  </div>
                  {log.tenant_name && log.tenant_name !== "Platform Global" && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <Building2 size={10} className="text-primary" />
                      <span>{log.tenant_name}</span>
                    </div>
                  )}
                </td>

                <td className="px-4 py-3.5">
                  <span className="font-medium text-foreground truncate max-w-[140px] block">
                    {log.actor}
                  </span>
                </td>

                <td className="px-4 py-3.5 max-w-xs">
                  <p className="text-foreground truncate font-medium">{log.description}</p>
                  {log.target && (
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      Target: {log.target}
                    </p>
                  )}
                </td>

                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onSelectLog(log)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
