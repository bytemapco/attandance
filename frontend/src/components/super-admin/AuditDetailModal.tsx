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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#28363b]/40 backdrop-blur-xs" onClick={onClose}>
      <div
        className="bg-card border border-[#e3e1dc] rounded-2xl w-full max-w-2xl shadow-[0_12px_36px_rgba(40,54,59,0.14)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-[#e3e1dc] flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#f7efea] text-[#c98260] border border-[#f0ded4]">
              <ShieldAlert size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#202b30]">{formatEventTitle(log.event_type)}</h3>
                <GlassBadge variant={getSeverityVariant(log.severity)}>
                  {log.severity}
                </GlassBadge>
              </div>
              <p className="text-xs text-[#526f78] mt-0.5">
                {log.tenant_name && log.tenant_name !== "Platform Global" ? log.tenant_name : "Global Platform"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#526f78] hover:text-[#202b30] rounded-lg hover:bg-secondary transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4.5 overflow-y-auto text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-secondary/50 border border-[#e3e1dc] space-y-1">
              <span className="text-[11px] text-[#526f78] font-medium flex items-center gap-1">
                <Clock size={12} /> Timestamp
              </span>
              <p className="font-semibold text-[#202b30]">
                {new Date(log.timestamp).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "medium",
                })}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/50 border border-[#e3e1dc] space-y-1">
              <span className="text-[11px] text-[#526f78] font-medium flex items-center gap-1">
                <User size={12} /> Actor
              </span>
              <p className="font-semibold text-[#202b30] truncate" title={log.actor}>
                {formatActorName(log.actor)}
                {log.actor.includes("@") && (
                  <span className="font-normal text-muted-foreground text-[11px] ml-1.5 font-mono">({log.actor})</span>
                )}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/50 border border-[#e3e1dc] space-y-1">
              <span className="text-[11px] text-[#526f78] font-medium flex items-center gap-1">
                <Globe size={12} /> Target Resource
              </span>
              <p className="font-semibold text-[#202b30] truncate font-mono text-[11px]">
                {log.target || "N/A"}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[#526f78]">Summary</span>
            <div className="p-3.5 rounded-xl bg-secondary/40 border border-[#e3e1dc] text-[#202b30] font-medium leading-relaxed">
              {log.description}
            </div>
          </div>

          {/* Event Payload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#526f78]">Event Details (JSON)</span>
              <button
                type="button"
                onClick={() => void handleCopyJson()}
                className="inline-flex items-center gap-1 text-[11px] text-[#c98260] hover:underline cursor-pointer font-medium"
              >
                {copied ? <Check size={12} className="text-[#247653]" /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy Payload"}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-[#28363b] text-[#f8fafc] text-[11px] font-mono overflow-x-auto max-h-44 leading-relaxed border border-[#374950]">
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
        <div className="px-6 py-3.5 border-t border-[#e3e1dc] flex justify-end bg-card">
          <GlassButton variant="secondary" onClick={onClose}>
            Close
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
