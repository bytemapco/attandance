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
          bg: "bg-[#f9eaea] border-[#b54242]/30",
          text: "text-[#b54242]",
          icon: <AlertCircle size={12} />,
        };
      case "warning":
        return {
          bg: "bg-[#fbf1df] border-[#8a5b12]/30",
          text: "text-[#8a5b12]",
          icon: <AlertTriangle size={12} />,
        };
      case "success":
        return {
          bg: "bg-[#e8f3ed] border-[#247653]/30",
          text: "text-[#247653]",
          icon: <CheckCircle2 size={12} />,
        };
      case "info":
      default:
        return {
          bg: "bg-[#eaf2f6] border-[#306b8a]/30",
          text: "text-[#306b8a]",
          icon: <Info size={12} />,
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#e3e1dc]">
        <div className="p-2 rounded-lg bg-[#f7efea] text-[#c98260] border border-[#f0ded4] shrink-0">
          <Bell size={18} />
        </div>
        <h3 className="text-base font-semibold text-[#28363b]">Preview</h3>
      </div>

      <div className="rounded-lg border border-[#e3e1dc] bg-[#f5f2ed]/50 p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-[#28363b] text-white flex items-center justify-center shrink-0">
              <Bell size={11} />
            </div>
            <span className="text-xs font-semibold text-[#28363b]">
              SAHAJ Notice
            </span>
            <span className="text-[11px] text-[#718087]">•</span>
            <span className="text-[11px] text-[#718087] font-mono">Now</span>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.bg} ${badge.text}`}
          >
            {badge.icon}
            <span className="capitalize">{broadcast.category}</span>
          </span>
        </div>

        {/* Title & Body */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-[#202b30]">
            {broadcast.title || "Announcement Title"}
          </h4>
          <p className="text-xs text-[#526f78] leading-relaxed whitespace-pre-wrap">
            {broadcast.message || "Message content will be displayed here."}
          </p>
        </div>

        {/* Scope Footer */}
        <div className="pt-2 border-t border-[#e3e1dc] text-[11px] text-[#718087]">
          Audience: {broadcast.target_role ? broadcast.target_role.replace(/_/g, " ") : "All users"}
        </div>
      </div>
    </GlassCard>
  );
}
