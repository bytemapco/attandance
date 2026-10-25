"use client";

import React from "react";
import { Bell, ExternalLink, Smartphone, Shield, Eye } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import type { NotificationBroadcastCreate, NotificationType, NotificationCategory } from "@/types/notification";

interface CampusBroadcastPreviewProps {
  formData: NotificationBroadcastCreate;
}

function getPriorityBadge(type?: NotificationType): { label: string; style: string } {
  switch (type) {
    case "danger":
      return { label: "Urgent", style: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" };
    case "warning":
      return { label: "Warning", style: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" };
    case "success":
      return { label: "Success", style: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" };
    default:
      return { label: "Info", style: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20" };
  }
}

function getCategoryLabel(category?: NotificationCategory): string {
  switch (category) {
    case "attendance": return "Attendance";
    case "leave": return "Leave Management";
    case "device": return "Device Binding";
    case "security": return "Security";
    case "maintenance": return "Maintenance";
    case "update": return "System Update";
    case "system":
    default:
      return "Announcement";
  }
}

export default function CampusBroadcastPreview({ formData }: CampusBroadcastPreviewProps): React.JSX.Element {
  const priority = getPriorityBadge(formData.type);
  const categoryLabel = getCategoryLabel(formData.category);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye size={15} className="text-primary" />
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Live Preview Simulation
          </h2>
        </div>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <span>Real-time</span>
        </span>
      </div>

      {/* In-App Feed Card Simulation */}
      <GlassCard className="p-4 bg-card border border-border space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Bell size={13} />
            <span>In-App Notification Feed</span>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${priority.style}`}>
            {priority.label}
          </span>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-muted/30 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted border border-border text-foreground">
              {categoryLabel}
            </span>
            <span className="text-[10px] text-muted-foreground">Just now</span>
          </div>

          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {formData.title.trim() || "Untitled Broadcast Announcement"}
          </h3>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {formData.message.trim() || "Announcement message preview will be rendered dynamically as you type..."}
          </p>

          {formData.link && (
            <div className="pt-1 flex items-center gap-1 text-xs text-primary font-medium">
              <span>Action:</span>
              <span className="underline truncate max-w-[200px]">{formData.link}</span>
              <ExternalLink size={11} />
            </div>
          )}
        </div>
      </GlassCard>

      {/* Mobile Lock Screen Push Banner */}
      <GlassCard className="p-4 bg-card border border-border space-y-3 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground pb-2 border-b border-border">
          <Smartphone size={13} />
          <span>Mobile Device Push Notification</span>
        </div>

        <div className="p-3 rounded-lg border border-border bg-background shadow-xs flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <Shield size={13} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Smart Attendance</span>
              <span>now</span>
            </div>
            <p className="text-xs font-semibold text-foreground truncate mt-0.5">
              {formData.title.trim() || "Campus Notice"}
            </p>
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
              {formData.message.trim() || "Push notifications delivered instantaneously to enrolled user devices."}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
