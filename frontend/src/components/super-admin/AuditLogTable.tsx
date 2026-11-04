"use client";

import React from "react";
import { Eye, AlertTriangle, AlertCircle, Info, Building2 } from "lucide-react";
import type { SuperAdminAuditLog } from "@/types/tenant";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

function formatEventType(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatActor(actor: string): { display: string; full: string } {
  if (!actor || actor.toLowerCase() === "system") {
    return { display: "System", full: actor };
  }
  // If it's a UUID, show shortened System identifier
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actor)) {
    return { display: `System (${actor.slice(0, 8)})`, full: actor };
  }
  // If it's an email like aravind.admin.iitb@yopmail.com or john.doe@school.edu
  if (actor.includes("@")) {
    const username = actor.split("@")[0];
    // Remove typical role/tenant suffixes like .admin.iitb or .staff
    const cleanUsername = username
      .replace(/\.(admin|superadmin|teacher|student|staff).*$/i, "")
      .replace(/[-_.]+/g, " ")
      .trim();

    const formattedName = cleanUsername
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");

    return { display: formattedName || username, full: actor };
  }
  // Otherwise format regular text
  const clean = actor.replace(/[-_.]+/g, " ").trim();
  const formatted = clean
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

  return { display: formatted || actor, full: actor };
}

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
      <div className="space-y-4 rounded-lg border border-border bg-card p-4" role="status" aria-label="Loading audit log" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="hidden h-7 w-20 sm:block" />
          </div>
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
      case "ERROR":
        return (
          <GlassBadge variant="danger" className="gap-1 text-[11px]">
            <AlertCircle size={11} /> {sev}
          </GlassBadge>
        );
      case "WARNING":
        return (
          <GlassBadge variant="warning" className="gap-1 text-[11px]">
            <AlertTriangle size={11} /> {sev}
          </GlassBadge>
        );
      case "INFO":
      default:
        return (
          <GlassBadge variant="info" className="gap-1 text-[11px]">
            <Info size={11} /> {sev}
          </GlassBadge>
        );
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => {
              const actorInfo = formatActor(log.actor);
              return (
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

                  <td className="px-4 py-3.5 min-w-[180px]">
                    <div className="font-semibold text-foreground text-xs">
                      {formatEventType(log.event_type)}
                    </div>
                    {log.tenant_name && log.tenant_name !== "Platform Global" && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <Building2 size={11} className="text-accent-strong shrink-0" />
                        <span className="truncate max-w-[200px]">{log.tenant_name}</span>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3.5 max-w-[160px]">
                    <span className="font-medium text-foreground truncate block" title={actorInfo.full}>
                      {actorInfo.display}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 max-w-sm">
                    <p className="text-foreground truncate font-medium">{log.description}</p>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
