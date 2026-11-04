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

function formatEventTitle(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatActorName(actor: string): string {
  if (!actor || actor.toLowerCase() === "system") return "System";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actor)) {
    return `System (${actor.slice(0, 8)})`;
  }
  if (actor.includes("@")) {
    const user = actor.split("@")[0]
      .replace(/\.(admin|superadmin|teacher|student|staff).*$/i, "")
      .replace(/[-_.]+/g, " ")
      .trim();
    return user
      .split(" ")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  }
  return actor;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-[0_12px_36px_rgba(40,54,59,0.14)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-soft text-accent-strong border border-accent-border">
              <ShieldAlert size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">{formatEventTitle(log.event_type)}</h3>
                <GlassBadge variant={getSeverityVariant(log.severity)}>
                  {log.severity}
                </GlassBadge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {log.tenant_name && log.tenant_name !== "Platform Global" ? log.tenant_name : "Global Platform"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4.5 overflow-y-auto text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Clock size={12} /> Timestamp
              </span>
              <p className="font-semibold text-foreground">
                {new Date(log.timestamp).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "medium",
                })}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <User size={12} /> Actor
              </span>
              <p className="font-semibold text-foreground truncate" title={log.actor}>
                {formatActorName(log.actor)}
                {log.actor.includes("@") && (
                  <span className="font-normal text-muted-foreground text-[11px] ml-1.5 font-mono">({log.actor})</span>
                )}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Globe size={12} /> Target Resource
              </span>
              <p className="font-semibold text-foreground truncate font-mono text-[11px]">
                {log.target || "N/A"}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Summary</span>
            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border text-foreground font-medium leading-relaxed">
              {log.description}
            </div>
          </div>

          {/* Event Payload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Event Details (JSON)</span>
              <button
                type="button"
                onClick={() => void handleCopyJson()}
                className="inline-flex items-center gap-1 text-[11px] text-accent-strong hover:underline cursor-pointer font-medium"
              >
                {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy Payload"}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-mono overflow-x-auto max-h-44 leading-relaxed border border-foreground">
              {JSON.stringify(
                {
                  id: log.id,
                  event_type: log.event_type,
                  severity: log.severity,
                  actor: log.actor,
                  target: log.target,
                  tenant_id: log.tenant_id,
                  tenant_name: log.tenant_name,
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
        <div className="px-6 py-3.5 border-t border-border flex justify-end bg-card">
          <GlassButton variant="secondary" onClick={onClose}>
            Close
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
