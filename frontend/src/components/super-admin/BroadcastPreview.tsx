"use client";

import React from "react";
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import Card from "@/components/ui/Card";
import type { GlobalBroadcastRequest } from "@/types/tenant";

interface BroadcastPreviewProps {
  broadcast: GlobalBroadcastRequest;
}

export default function BroadcastPreview({ broadcast }: BroadcastPreviewProps): React.ReactElement {
  const getBadgeStyle = (): { bg: string; text: string; icon: React.ReactNode } => {
    switch (broadcast.type) {
      case "critical":
        return {
          bg: "bg-destructive-soft border-destructive/30",
          text: "text-destructive",
          icon: <AlertCircle size={12} />,
        };
      case "warning":
        return {
          bg: "bg-warning-soft border-warning/30",
          text: "text-warning",
          icon: <AlertTriangle size={12} />,
        };
      case "success":
        return {
          bg: "bg-success-soft border-success/30",
          text: "text-success",
          icon: <CheckCircle2 size={12} />,
        };
      case "info":
      default:
        return {
          bg: "bg-info-soft border-info/30",
          text: "text-info",
          icon: <Info size={12} />,
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
        <div className="p-2 rounded-lg bg-accent-soft text-accent-strong border border-accent-border shrink-0">
          <Bell size={18} />
        </div>
        <h3 className="text-base font-semibold text-primary">Preview</h3>
      </div>

      <div className="rounded-lg border border-border bg-background/50 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Bell size={11} />
            </div>
            <span className="text-xs font-semibold text-primary">
              SAHAJ Notice
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-mono">Now</span>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${badge.bg} ${badge.text}`}
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
            {broadcast.message || "Message content will be displayed here."}
          </p>
        </div>

        {/* Scope Footer */}
        <div className="pt-2 border-t border-border text-xs text-muted-foreground">
          Audience: {broadcast.target_role ? broadcast.target_role.replace(/_/g, " ") : "All users"}
        </div>
      </div>
    </Card>
  );
}
