"use client";

import React, { useState } from "react";
import { X, Copy, Check, ShieldAlert, Clock, User, Globe } from "lucide-react";
import type { SuperAdminAuditLog } from "@/types";
import GlassBadge, { type BadgeVariant } from "@/components/ui/GlassBadge";
import GlassButton from "@/components/ui/GlassButton";
import toast from "react-hot-toast";

interface AuditDetailModalProps {
  log: SuperAdminAuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditDetailModal({
  log,
  isOpen,
  onClose,
}: AuditDetailModalProps): React.ReactElement | null {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !log) return null;

  const handleCopyJson = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
      setCopied(true);
      toast.success("Audit log JSON copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy JSON");
    }
  };

  const getSeverityVariant = (sev: string): BadgeVariant => {
    switch (sev) {
      case "CRITICAL":
      case "ERROR":
        return "danger";
      case "WARNING":
        return "warning";
      case "INFO":
      default:
        return "info";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldAlert size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">{log.event_type}</h3>
                <GlassBadge variant={getSeverityVariant(log.severity)}>
                  {log.severity}
                </GlassBadge>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">ID: {log.id}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock size={12} /> Timestamp
              </span>
              <p className="font-semibold text-foreground">
                {new Date(log.timestamp).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "medium",
                })}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <User size={12} /> Actor
              </span>
              <p className="font-semibold text-foreground truncate">{log.actor}</p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Globe size={12} /> Target & Scope
              </span>
              <p className="font-semibold text-foreground truncate">{log.target || log.tenant_name || "Platform Global"}</p>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground">IP Address</span>
              <p className="font-mono text-foreground">{log.ip_address || "Internal / System Service"}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Description</span>
            <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs text-foreground font-medium">
              {log.description}
            </div>
          </div>

          {/* Raw JSON Details */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Audit Record JSON Payload</span>
              <button
                type="button"
                onClick={() => void handleCopyJson()}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy JSON"}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-black/80 border border-border text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48 scrollbar-thin">
              {JSON.stringify(
                {
                  id: log.id,
                  event_type: log.event_type,
                  severity: log.severity,
                  actor: log.actor,
                  target: log.target,
                  tenant_id: log.tenant_id,
                  tenant_name: log.tenant_name,
                  ip_address: log.ip_address,
                  description: log.description,
                  metadata: log.metadata,
                  timestamp: log.timestamp,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-end bg-muted/20">
          <GlassButton variant="secondary" onClick={onClose}>
            Close
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
