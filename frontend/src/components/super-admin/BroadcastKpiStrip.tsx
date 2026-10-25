"use client";

import React from "react";
import { Radio, Users, Send, ShieldCheck } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";

interface BroadcastKpiStripProps {
  totalSent: number;
}

export default function BroadcastKpiStrip({ totalSent }: BroadcastKpiStripProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Sent */}
      <GlassCard className="p-4 flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
            <Radio size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Total Announcements</p>
            <p className="text-2xl font-bold text-foreground truncate">
              {totalSent}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* 2. Target Reach */}
      <GlassCard className="p-4 flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Broadcast Scope</p>
            <p className="text-xl font-bold text-foreground truncate">
              All Institutions
            </p>
          </div>
        </div>
      </GlassCard>

      {/* 3. Dispatch Channel */}
      <GlassCard className="p-4 flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
            <Send size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Dispatch Mode</p>
            <p className="text-xl font-bold text-foreground truncate">
              Live WebSocket
            </p>
          </div>
        </div>
      </GlassCard>

      {/* 4. Delivery Pipeline */}
      <GlassCard className="p-4 flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Channel State</p>
            <p className="text-xl font-bold text-foreground truncate">
              Operational
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
