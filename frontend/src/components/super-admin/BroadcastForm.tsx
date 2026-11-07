"use client";

import React from "react";
import { Send, Radio, Info, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ScheduleField from "@/components/announcements/ScheduleField";
import type { GlobalBroadcastRequest } from "@/types/tenant";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectMenu";

interface BroadcastFormProps {
  form: GlobalBroadcastRequest;
  onChange: (updated: Partial<GlobalBroadcastRequest>) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}

const AUDIENCE_OPTIONS: Array<{ value: GlobalBroadcastRequest["target_role"]; label: string }> = [
  { value: "ALL", label: "All users" },
  { value: "ADMIN", label: "Institution admins" },
  { value: "TEACHER", label: "Faculty" },
  { value: "STUDENT", label: "Students" },
];

const CATEGORY_OPTIONS = [
  { value: "system", label: "System" },
  { value: "maintenance", label: "Maintenance" },
  { value: "security", label: "Security" },
  { value: "update", label: "Update" },
];

const SEVERITY_TYPES: Array<{
  value: GlobalBroadcastRequest["type"];
  label: string;
  icon: React.ReactNode;
  activeClass: string;
}> = [
  {
    value: "info",
    label: "Info",
    icon: <Info size={13} />,
    activeClass: "bg-info-soft border-info text-info",
  },
  {
    value: "warning",
    label: "Warning",
    icon: <AlertTriangle size={13} />,
    activeClass: "bg-warning-soft border-warning text-warning",
  },
  {
    value: "critical",
    label: "Critical",
    icon: <AlertCircle size={13} />,
    activeClass: "bg-destructive-soft border-destructive text-destructive",
  },
  {
    value: "success",
    label: "Success",
    icon: <CheckCircle2 size={13} />,
    activeClass: "bg-success-soft border-success text-success",
  },
];

export default function BroadcastForm({
  form,
  onChange,
  onSubmit,
  submitting,
}: BroadcastFormProps): React.ReactElement {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
        <div className="p-2 rounded-lg bg-secondary text-primary border border-border shrink-0">
          <Radio size={18} />
        </div>
        <h3 className="text-base font-semibold text-primary">New Announcement</h3>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Title</label>
          <input
            type="text"
            placeholder="e.g. Scheduled platform maintenance"
            value={form.title}
            onChange={(e) => onChange({ title: e.target.value })}
            required
            className="w-full px-3.5 py-2 bg-card border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        {/* Audience & Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Audience</label>
            <Select
              value={form.target_role}
              onValueChange={(val) => onChange({ target_role: val as GlobalBroadcastRequest["target_role"] })}
            >
              <SelectTrigger className="w-full h-9 bg-card border-border text-xs rounded-lg text-foreground">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Category</label>
            <Select
              value={form.category}
              onValueChange={(val) => onChange({ category: val as GlobalBroadcastRequest["category"] })}
            >
              <SelectTrigger className="w-full h-9 bg-card border-border text-xs rounded-lg text-foreground">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Severity */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Severity</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SEVERITY_TYPES.map((sev) => {
              const isActive = form.type === sev.value;
              return (
                <button
                  key={sev.value}
                  type="button"
                  onClick={() => onChange({ type: sev.value })}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? sev.activeClass
                      : "bg-secondary/60 border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {sev.icon}
                  <span>{sev.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Message</label>
          <textarea
            rows={4}
            placeholder="Type your announcement details here..."
            value={form.message}
            onChange={(e) => onChange({ message: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 bg-card border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-y transition-colors leading-relaxed"
          />
        </div>

        <ScheduleField value={form.publish_at} onChange={(publish_at) => onChange({ publish_at })} />

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={!form.title.trim() || !form.message.trim() || submitting}
            className="gap-2 text-xs font-semibold px-4"
          >
            <Send size={13} />
            <span>{form.publish_at ? "Schedule Announcement" : "Send Announcement"}</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}
