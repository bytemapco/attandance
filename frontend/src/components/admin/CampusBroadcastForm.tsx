"use client";

import React from "react";
import { Megaphone, Send, RotateCcw } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import BroadcastTargetSection from "@/components/admin/BroadcastTargetSection";
import type { NotificationBroadcastCreate } from "@/types/notification";

interface CampusBroadcastFormProps {
  formData: NotificationBroadcastCreate;
  onChange: (data: NotificationBroadcastCreate) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  onReset: () => void;
}

export default function CampusBroadcastForm({
  formData,
  onChange,
  onSubmit,
  submitting,
  onReset,
}: CampusBroadcastFormProps): React.JSX.Element {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <GlassCard className="p-5 bg-card border border-border space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Megaphone size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-primary">Announcement Content</h2>
            <p className="text-xs text-muted-foreground">Draft title, detailed description, and optional action link.</p>
          </div>
        </div>

        <div>
          <label htmlFor="broadcast-title" className="text-xs font-semibold text-primary block mb-1">
            Announcement Title <span className="text-destructive">*</span>
          </label>
          <input
            id="broadcast-title"
            type="text"
            required
            placeholder="e.g. Scheduled Campus Network Maintenance Window"
            value={formData.title}
            onChange={(e) => onChange({ ...formData, title: e.target.value })}
            maxLength={120}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-xs sm:text-sm text-primary placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
          />
        </div>

        <div>
          <label htmlFor="broadcast-message" className="text-xs font-semibold text-primary block mb-1">
            Message Body <span className="text-destructive">*</span>
          </label>
          <textarea
            id="broadcast-message"
            required
            rows={4}
            placeholder="Provide clear, concise information about the announcement or required actions..."
            value={formData.message}
            onChange={(e) => onChange({ ...formData, message: e.target.value })}
            maxLength={500}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-xs sm:text-sm text-primary placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all resize-y"
          />
          <div className="flex justify-end mt-1 text-xs text-muted-foreground">
            {formData.message.length}/500 characters
          </div>
        </div>

        <div>
          <label htmlFor="broadcast-link" className="text-xs font-semibold text-primary block mb-1">
            Action Deep Link <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
          </label>
          <input
            id="broadcast-link"
            type="text"
            placeholder="e.g. /teacher/dashboard or https://portal.institution.edu/notices"
            value={formData.link || ""}
            onChange={(e) => onChange({ ...formData, link: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs text-primary placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all font-mono"
          />
        </div>
      </GlassCard>

      <BroadcastTargetSection formData={formData} onChange={onChange} />

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onReset}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-primary bg-card border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>Reset Draft</span>
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-foreground rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Send size={13} />
          <span>{submitting ? "Dispatching..." : "Dispatch Broadcast Announcement"}</span>
        </button>
      </div>
    </form>
  );
}
