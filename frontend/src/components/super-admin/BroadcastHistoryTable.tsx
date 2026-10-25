"use client";

import React, { useState, useEffect, useCallback } from "react";
import { History, RefreshCw, Radio, Users, AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { superAdminService } from "@/lib/services/superAdminService";
import GlassCard from "@/components/ui/GlassCard";
import GlassBadge, { type BadgeVariant } from "@/components/ui/GlassBadge";
import type { BroadcastHistoryItem } from "@/types/tenant";

interface BroadcastHistoryTableProps {
  refreshTrigger?: number;
  onCountChange?: (count: number) => void;
}

export default function BroadcastHistoryTable({
  refreshTrigger,
  onCountChange,
}: BroadcastHistoryTableProps): React.ReactElement {
  const [items, setItems] = useState<BroadcastHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const res = await superAdminService.getBroadcasts(1, 15);
      const list = res.items || [];
      setItems(list);
      if (onCountChange) {
        onCountChange(list.length);
      }
    } catch {
      setError("Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory, refreshTrigger]);

  const getSeverityBadge = (severity: string): { variant: BadgeVariant; icon: React.ReactElement } => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
      case "ERROR":
        return { variant: "danger", icon: <AlertCircle size={11} className="text-destructive" /> };
      case "WARNING":
        return { variant: "warning", icon: <AlertTriangle size={11} className="text-amber-500" /> };
      case "SUCCESS":
        return { variant: "success", icon: <CheckCircle2 size={11} className="text-emerald-500" /> };
      case "INFO":
      default:
        return { variant: "info", icon: <Info size={11} className="text-blue-500" /> };
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <History size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Dispatch History</h3>
            <p className="text-xs text-muted-foreground">{items.length} announcements recorded</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void fetchHistory()}
          disabled={loading}
          className="p-2 rounded-xl border border-border/60 bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Refresh history"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-primary" : ""} />
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
          <RefreshCw size={15} className="animate-spin text-primary" />
          <span>Loading...</span>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-destructive">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void fetchHistory()}
            className="mt-2 text-xs font-medium text-foreground underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
          <Radio size={18} className="text-muted-foreground/40" />
          <p className="font-medium text-foreground">No announcements sent yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/10">
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Audience</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Delivered</th>
                <th className="py-2.5 px-3">Sender</th>
                <th className="py-2.5 px-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono text-[11px]">
              {items.map((item) => {
                const badge = getSeverityBadge(item.severity);
                return (
                  <tr key={item.id} className="hover:bg-muted/15 transition-colors">
                    <td className="py-3 px-3 font-sans max-w-[280px]">
                      <div className="font-medium text-foreground truncate">{item.title}</div>
                      <div className="text-[11px] text-muted-foreground font-sans truncate mt-0.5">
                        {item.description}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-sans">
                        <Users size={11} className="text-muted-foreground/70" />
                        <span>{item.target ? item.target.replace(/_/g, " ") : "All users"}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <GlassBadge variant={badge.variant} className="gap-1 text-[10px]">
                        {badge.icon}
                        <span>{item.severity}</span>
                      </GlassBadge>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-foreground font-sans text-xs">
                      {item.delivered_count > 0 ? `${item.delivered_count} users` : "—"}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-muted-foreground text-xs font-sans truncate max-w-[140px]">
                      {item.actor}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-right text-muted-foreground font-sans text-xs">
                      {new Date(item.timestamp).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}
