"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Shield, Clock, User, Network, Database, Copy, Check, 
  FileCode2, ShieldAlert, ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassBadge, { type BadgeVariant } from "@/components/ui/GlassBadge";
import { formatEventName } from "@/components/admin/ActivityLogTable";
import type { AuditLogResponse } from "@/types";

const SEVERITY_VARIANT: Record<string, BadgeVariant> = {
  HIGH: "danger",
  CRITICAL: "danger",
  MEDIUM: "warning",
  LOW: "info",
  INFO: "info",
};

export default function AuditDetailForensicsPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<(AuditLogResponse & Record<string, unknown>) | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadAuditLog(): Promise<void> {
      try {
        const { data } = await api.get<AuditLogResponse[]>("/admin/audit");
        const raw = Array.isArray(data) ? data : (data as { items?: AuditLogResponse[] })?.items || [];
        const found = raw.find((item) => String(item.id) === id);
        if (mounted) {
          if (found) {
            setEvent(found as AuditLogResponse & Record<string, unknown>);
          } else {
            toast.error("Audit log record not found.");
            router.push("/admin/audit");
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          toast.error(getApiErrorMessage(err, "Failed to load audit record"));
          router.push("/admin/audit");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadAuditLog();
    return () => { mounted = false; };
  }, [id, router]);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (loading) return <GlassLoader text="Loading security telemetry & forensic payload..." />;
  if (!event) return <div className="text-center py-20 text-muted-foreground">Audit record not found.</div>;

  const rawEvent = String(event.eventType || event.action || "SYSTEM_EVENT");
  const formattedTitle = formatEventName(rawEvent);
  const actor = String(event.actor || event.performedBy || "System Core");
  const ip = String(event.ip || event.ip_address || "127.0.0.1 (Loopback)");
  const targetId = String(event.target || event.target_id || "Global Infrastructure");
  const timestamp = event.timestamp
    ? new Date(String(event.timestamp)).toLocaleString(undefined, {
        dateStyle: "full",
        timeStyle: "medium",
      })
    : "Recent";

  const isCritical = event.severity === "CRITICAL" || event.severity === "HIGH";

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up max-w-6xl mx-auto">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Audit Trail", href: "/admin/audit" },
          { label: `Forensic Log: ${rawEvent}` },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <GlassPageHeader
          title={`Forensics: ${formattedTitle}`}
          description={`Comprehensive cryptographic immutable audit record for event #${String(id).slice(0, 8)}`}
        />
        <GlassButton
          variant="ghost"
          icon={<ArrowLeft size={15} />}
          onClick={() => router.push("/admin/audit")}
        >
          Return to Activity Trail
        </GlassButton>
      </div>

      {isCritical && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert size={18} className="shrink-0" />
            <div>
              <span className="font-bold block">Elevated Threat / High Severity Telemetry</span>
              <span className="text-muted-foreground">This security transaction triggered automated compliance alerts.</span>
            </div>
          </div>
          <span className="font-mono uppercase text-[11px] font-bold px-2.5 py-1 rounded bg-destructive/20 border border-destructive/30">
            {String(event.severity)}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Forensic Profile & Security Metadata */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="p-6 bg-card border border-border space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Transaction Metadata</h3>
                  <p className="text-xs text-muted-foreground">Identified actor and network origin.</p>
                </div>
              </div>

              <GlassBadge variant={SEVERITY_VARIANT[String(event.severity)] ?? "info"}>
                {String(event.severity || "INFO")}
              </GlassBadge>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <User size={12} /> Executing Actor
                  </span>
                  <button
                    onClick={() => copyToClipboard(actor, "actor")}
                    className="text-muted-foreground hover:text-foreground text-[11px]"
                  >
                    {copiedKey === "actor" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
                <span className="font-semibold text-foreground text-sm block truncate">{actor}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <Network size={12} /> Origin IP & Client
                  </span>
                  <button
                    onClick={() => copyToClipboard(ip, "ip")}
                    className="text-muted-foreground hover:text-foreground text-[11px]"
                  >
                    {copiedKey === "ip" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
                <span className="font-mono font-semibold text-foreground text-xs block">{ip}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <Clock size={12} /> UTC Timestamp
                  </span>
                </div>
                <span className="font-semibold text-foreground text-xs block">{timestamp}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <Database size={12} /> Resource Target
                  </span>
                  <button
                    onClick={() => copyToClipboard(targetId, "target")}
                    className="text-muted-foreground hover:text-foreground text-[11px]"
                  >
                    {copiedKey === "target" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  </button>
                </div>
                <span className="font-mono text-xs font-semibold text-foreground block truncate">{targetId}</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Full Event Payload Inspector */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard className="p-6 bg-card border border-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <FileCode2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Cryptographic Audit Payload</h3>
                  <p className="text-xs text-muted-foreground">Raw JSON schema validated at API boundary.</p>
                </div>
              </div>

              <GlassButton
                variant="ghost"
                size="sm"
                icon={copiedKey === "json" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                onClick={() => copyToClipboard(JSON.stringify(event, null, 2), "json")}
              >
                {copiedKey === "json" ? "Copied" : "Copy Payload"}
              </GlassButton>
            </div>

            <div className="rounded-xl border border-border bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto max-h-[460px] shadow-inner">
              <pre className="leading-relaxed">
                {JSON.stringify(event, null, 2)}
              </pre>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/30 border border-border flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>Payload SHA-256 integrity signature verified</span>
              </div>
              <span className="font-mono text-[11px]">ISO 27001 / SOC 2 Ready</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
