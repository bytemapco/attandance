"use client";

import React from "react";
import { Megaphone, Users, Send, RotateCcw } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import type { NotificationBroadcastCreate, NotificationCategory, NotificationType } from "@/types/notification";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CampusBroadcastFormProps {
  formData: NotificationBroadcastCreate;
  onChange: (data: NotificationBroadcastCreate) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  onReset: () => void;
}

const AUDIENCE_OPTIONS: { id: "ALL" | "STUDENT" | "TEACHER" | "ADMIN"; label: string; desc: string }[] = [
  { id: "ALL", label: "All Campus Users", desc: "Students, Teachers, and Staff" },
  { id: "STUDENT", label: "Students Only", desc: "All enrolled students" },
  { id: "TEACHER", label: "Faculty Only", desc: "Active teaching staff" },
  { id: "ADMIN", label: "Administrators", desc: "Institutional managers" },
];

export default function CampusBroadcastForm({
  formData,
  onChange,
  onSubmit,
  submitting,
  onReset,
}: CampusBroadcastFormProps): React.JSX.Element {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Content Section */}
      <GlassCard className="p-5 bg-card border border-border space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Megaphone size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Announcement Content</h2>
            <p className="text-xs text-muted-foreground">Draft title, detailed description, and optional action link.</p>
          </div>
        </div>

        <div>
          <label htmlFor="broadcast-title" className="text-xs font-semibold text-foreground block mb-1">
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
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        <div>
          <label htmlFor="broadcast-message" className="text-xs font-semibold text-foreground block mb-1">
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
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-y"
          />
          <div className="flex justify-end mt-1 text-[11px] text-muted-foreground">
            {formData.message.length}/500 characters
          </div>
        </div>

        <div>
          <label htmlFor="broadcast-link" className="text-xs font-semibold text-foreground block mb-1">
            Action Deep Link <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
          </label>
          <input
            id="broadcast-link"
            type="text"
            placeholder="e.g. /teacher/classes or https://portal.institution.edu/notices"
            value={formData.link || ""}
            onChange={(e) => onChange({ ...formData, link: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
          />
        </div>
      </GlassCard>

      {/* Target & Classification Section */}
      <GlassCard className="p-5 bg-card border border-border space-y-4 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Users size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Target Audience & Delivery Classification</h2>
            <p className="text-xs text-muted-foreground">Specify recipient group, priority urgency, and category tag.</p>
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-foreground block mb-2">
            Target Recipient Group <span className="text-destructive">*</span>
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AUDIENCE_OPTIONS.map((opt) => {
              const isSelected = (formData.target_role || "ALL") === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ ...formData, target_role: opt.id })}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-card text-foreground border-primary ring-1 ring-primary shadow-2xs"
                      : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Priority / Urgency
            </label>
            <Select
              value={formData.type || "info"}
              onValueChange={(val) => onChange({ ...formData, type: val as NotificationType })}
            >
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Normal (Informational)</SelectItem>
                <SelectItem value="warning">Warning (Action Required)</SelectItem>
                <SelectItem value="danger">Urgent / Emergency</SelectItem>
                <SelectItem value="success">Success / Resolution</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Category Tag
            </label>
            <Select
              value={formData.category || "system"}
              onValueChange={(val) => onChange({ ...formData, category: val as NotificationCategory })}
            >
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">Campus Operations & General</SelectItem>
                <SelectItem value="attendance">Attendance & Lectures</SelectItem>
                <SelectItem value="security">Security & Campus Safety</SelectItem>
                <SelectItem value="leave">Leaves & Holidays</SelectItem>
                <SelectItem value="device">Devices & System Hardware</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onReset}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>Reset Draft</span>
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Send size={13} />
          <span>{submitting ? "Dispatching..." : "Dispatch Broadcast Announcement"}</span>
        </button>
      </div>
    </form>
  );
}
