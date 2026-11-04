"use client";

import React, { useState, useEffect, useCallback } from "react";
import { History, RefreshCw, Radio, Users, AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { superAdminService } from "@/services/superAdminService";
import Card from "@/components/ui/Card";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
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
        return { variant: "warning", icon: <AlertTriangle size={11} className="text-warning" /> };
      case "SUCCESS":
        return { variant: "success", icon: <CheckCircle2 size={11} className="text-success" /> };
      case "INFO":
      default:
        return { variant: "info", icon: <Info size={11} className="text-info" /> };
    }
  };

  const formatActor = (actor: string): string => {
    if (!actor) return "System";
    if (actor.includes("@")) {
      const namePart = actor.split("@")[0].split(".")[0];
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
    return actor;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary text-muted-foreground border border-border shrink-0">
            <History size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-primary">Announcement History</h3>
            <p className="text-xs text-muted-foreground">{items.length} recorded</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void fetchHistory()}
          disabled={loading}
          className="p-2 rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Refresh history"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-accent-strong" : ""} />
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
          <RefreshCw size={15} className="animate-spin text-accent-strong" />
          <span>Loading...</span>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-destructive">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void fetchHistory()}
            className="mt-2 text-xs font-semibold text-foreground underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5">
          <Radio size={18} className="text-muted-foreground/50" />
          <p className="font-semibold text-foreground">No announcements sent yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-muted-foreground bg-secondary/40">
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Audience</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Delivered</th>
                <th className="py-2.5 px-3">Sender</th>
                <th className="py-2.5 px-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {items.map((item) => {
                const badge = getSeverityBadge(item.severity);
                return (
                  <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-3 max-w-[280px]">
                      <div className="font-semibold text-foreground truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {item.description}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Users size={11} className="text-muted-foreground" />
                        <span>{item.target ? item.target.replace(/_/g, " ") : "All users"}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <Badge variant={badge.variant} className="gap-1 text-xs">
                        {badge.icon}
                        <span>{item.severity}</span>
                      </Badge>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-foreground text-xs">
                      {item.delivered_count > 0 ? `${item.delivered_count} users` : "—"}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-muted-foreground text-xs truncate max-w-[140px]">
                      {formatActor(item.actor)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-right text-muted-foreground text-xs font-mono">
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
    </Card>
  );
}
