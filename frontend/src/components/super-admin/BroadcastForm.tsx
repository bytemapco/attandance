"use client";

import React from "react";
import { Send, Radio, Info, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";
import type { GlobalBroadcastRequest } from "@/types/tenant";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BroadcastFormProps {
  form: GlobalBroadcastRequest;
  onChange: (updated: Partial<GlobalBroadcastRequest>) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}

const AUDIENCE_OPTIONS = [
  { value: "ALL", label: "All users" },
  { value: "SUPER_ADMIN", label: "Super admins" },
  { value: "TENANT_ADMIN", label: "Institution admins" },
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
    activeClass: "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400",
  },
  {
    value: "warning",
    label: "Warning",
    icon: <AlertTriangle size={13} />,
    activeClass: "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
  },
  {
    value: "critical",
    label: "Critical",
    icon: <AlertCircle size={13} />,
    activeClass: "bg-destructive/15 border-destructive/30 text-destructive",
  },
  {
    value: "success",
    label: "Success",
    icon: <CheckCircle2 size={13} />,
    activeClass: "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
  },
];

export default function BroadcastForm({
  form,
  onChange,
  onSubmit,
  submitting,
}: BroadcastFormProps): React.ReactElement {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
        <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
          <Radio size={20} />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Composer</h3>
          <p className="text-xs text-muted-foreground">Draft platform announcement</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <input
            type="text"
            placeholder="Maintenance on Sunday"
            value={form.title}
            onChange={(e) => onChange({ title: e.target.value })}
            required
            className="w-full px-3.5 py-2 bg-muted/20 border border-border/60 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        {/* Audience & Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Audience</label>
            <Select
              value={form.target_role || "ALL"}
              onValueChange={(val) => onChange({ target_role: val === "ALL" ? undefined : val })}
            >
              <SelectTrigger className="w-full h-9 bg-muted/20 border-border/60 text-xs rounded-xl">
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
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Select
              value={form.category}
              onValueChange={(val) => onChange({ category: val as GlobalBroadcastRequest["category"] })}
            >
              <SelectTrigger className="w-full h-9 bg-muted/20 border-border/60 text-xs rounded-xl">
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
          <label className="text-xs font-medium text-muted-foreground">Severity</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SEVERITY_TYPES.map((sev) => {
              const isActive = form.type === sev.value;
              return (
                <button
                  key={sev.value}
                  type="button"
                  onClick={() => onChange({ type: sev.value })}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? sev.activeClass
                      : "bg-muted/10 border-border/60 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
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
          <label className="text-xs font-medium text-muted-foreground">Message</label>
          <textarea
            rows={4}
            placeholder="Announcement message..."
            value={form.message}
            onChange={(e) => onChange({ message: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 bg-muted/20 border border-border/60 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-y transition-colors leading-relaxed"
          />
        </div>

        {/* Submit */}
        <div className="pt-1 flex justify-end">
          <GlassButton
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={!form.title.trim() || !form.message.trim() || submitting}
            className="gap-2 text-xs font-semibold px-4"
          >
            <Send size={13} />
            <span>Send</span>
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
}
