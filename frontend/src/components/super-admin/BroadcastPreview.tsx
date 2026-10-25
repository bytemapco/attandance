"use client";

import React from "react";
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import type { GlobalBroadcastRequest } from "@/types/tenant";

interface BroadcastPreviewProps {
  broadcast: GlobalBroadcastRequest;
}

export default function BroadcastPreview({ broadcast }: BroadcastPreviewProps): React.ReactElement {
  const getBadgeStyle = (): { bg: string; text: string; icon: React.ReactNode } => {
    switch (broadcast.type) {
      case "critical":
        return {
          bg: "bg-destructive/10 border-destructive/20",
          text: "text-destructive",
          icon: <AlertCircle size={13} />,
        };
      case "warning":
        return {
          bg: "bg-amber-500/10 border-amber-500/20",
          text: "text-amber-600 dark:text-amber-400",
          icon: <AlertTriangle size={13} />,
        };
      case "success":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20",
          text: "text-emerald-600 dark:text-emerald-400",
          icon: <CheckCircle2 size={13} />,
        };
      case "info":
      default:
        return {
          bg: "bg-blue-500/10 border-blue-500/20",
          text: "text-blue-600 dark:text-blue-400",
          icon: <Info size={13} />,
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
          <Bell size={20} />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Preview</h3>
          <p className="text-xs text-muted-foreground">Notification display on client</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card/70 p-4 space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-foreground text-background flex items-center justify-center shrink-0">
              <Bell size={11} />
            </div>
            <span className="text-xs font-semibold text-foreground">
              Attendance System
            </span>
            <span className="text-[11px] text-muted-foreground">•</span>
            <span className="text-[11px] text-muted-foreground font-mono">Now</span>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.bg} ${badge.text}`}
          >
            {badge.icon}
            <span className="capitalize">{broadcast.category}</span>
          </span>
        </div>

        {/* Title & Body */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">
            {broadcast.title || "Announcement Title"}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {broadcast.message || "Message will appear here."}
          </p>
        </div>

        {/* Scope Footer */}
        <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
          Audience: {broadcast.target_role ? broadcast.target_role.replace(/_/g, " ") : "All users"}
        </div>
      </div>
    </GlassCard>
  );
}
