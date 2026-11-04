"use client";

import React from "react";
import { Bell, ExternalLink, Smartphone, Eye } from "lucide-react";
import Card from "@/components/ui/Card";
import type { NotificationBroadcastCreate, NotificationType, NotificationCategory } from "@/types/notification";

interface CampusBroadcastPreviewProps {
  formData: NotificationBroadcastCreate;
}

function getPriorityBadge(type?: NotificationType): { label: string; style: string } {
  switch (type) {
    case "danger":
      return { label: "Urgent", style: "bg-destructive/10 text-destructive border-destructive/20" };
    case "warning":
      return { label: "Warning", style: "bg-warning/10 text-warning border-warning/20" };
    case "success":
      return { label: "Success", style: "bg-success/10 text-success border-success/20" };
    default:
      return { label: "Info", style: "bg-info/10 text-info border-info/20" };
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
          <h2 className="text-xs font-semibold text-foreground">
            Live Preview Simulation
          </h2>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
          <span>Real-time</span>
        </span>
      </div>

      {/* In-App Feed Card Simulation */}
      <Card className="p-4 bg-card border border-border space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Bell size={13} />
            <span>In-App Notification Feed</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm border ${priority.style}`}>
            {priority.label}
          </span>
        </div>

        <div className="p-3.5 rounded-lg border border-border bg-muted/30 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-1.5 py-0.5 rounded-sm bg-muted border border-border text-foreground">
              {categoryLabel}
            </span>
            <span className="text-xs text-muted-foreground">Just now</span>
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
      </Card>

      {/* Mobile Lock Screen Push Banner */}
      <Card className="p-4 bg-card border border-border space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground pb-2 border-b border-border">
          <Smartphone size={13} />
          <span>Mobile Device Push Notification</span>
        </div>

        <div className="p-3 rounded-lg border border-border bg-background flex items-start gap-2.5">
          <img
            src="/sahaj-app-icon.png"
            alt="SAHAJ"
            className="w-7 h-7 rounded-md object-contain shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">SAHAJ</span>
              <span>now</span>
            </div>
            <p className="text-xs font-semibold text-foreground truncate mt-0.5">
              {formData.title.trim() || "Campus Notice"}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
              {formData.message.trim() || "Push notifications delivered instantaneously to enrolled user devices."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
