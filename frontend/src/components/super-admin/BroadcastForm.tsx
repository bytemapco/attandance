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
    activeClass: "bg-[#eaf2f6] border-[#306b8a] text-[#306b8a]",
  },
  {
    value: "warning",
    label: "Warning",
    icon: <AlertTriangle size={13} />,
    activeClass: "bg-[#fbf1df] border-[#8a5b12] text-[#8a5b12]",
  },
  {
    value: "critical",
    label: "Critical",
    icon: <AlertCircle size={13} />,
    activeClass: "bg-[#f9eaea] border-[#b54242] text-[#b54242]",
  },
  {
    value: "success",
    label: "Success",
    icon: <CheckCircle2 size={13} />,
    activeClass: "bg-[#e8f3ed] border-[#247653] text-[#247653]",
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
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#e3e1dc]">
        <div className="p-2 rounded-lg bg-[#eeece7] text-[#28363b] border border-[#e3e1dc] shrink-0">
          <Radio size={18} />
        </div>
        <h3 className="text-base font-semibold text-[#28363b]">New Announcement</h3>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#526f78]">Title</label>
          <input
            type="text"
            placeholder="e.g. Scheduled platform maintenance"
            value={form.title}
            onChange={(e) => onChange({ title: e.target.value })}
            required
            className="w-full px-3.5 py-2 bg-card border border-[#e3e1dc] rounded-lg text-xs text-[#202b30] placeholder:text-[#718087] focus:outline-none focus:ring-1 focus:ring-[#28363b] focus:border-[#28363b] transition-colors"
          />
        </div>

        {/* Audience & Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#526f78]">Audience</label>
            <Select
              value={form.target_role || "ALL"}
              onValueChange={(val) => onChange({ target_role: val === "ALL" ? undefined : val })}
            >
              <SelectTrigger className="w-full h-9 bg-card border-[#e3e1dc] text-xs rounded-lg text-[#202b30]">
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
            <label className="text-xs font-semibold text-[#526f78]">Category</label>
            <Select
              value={form.category}
              onValueChange={(val) => onChange({ category: val as GlobalBroadcastRequest["category"] })}
            >
              <SelectTrigger className="w-full h-9 bg-card border-[#e3e1dc] text-xs rounded-lg text-[#202b30]">
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
          <label className="text-xs font-semibold text-[#526f78]">Severity</label>
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
                      : "bg-[#eeece7]/60 border-[#e3e1dc] text-[#526f78] hover:bg-[#eeece7] hover:text-[#202b30]"
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
          <label className="text-xs font-semibold text-[#526f78]">Message</label>
          <textarea
            rows={4}
            placeholder="Type your announcement details here..."
            value={form.message}
            onChange={(e) => onChange({ message: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 bg-card border border-[#e3e1dc] rounded-lg text-xs text-[#202b30] placeholder:text-[#718087] focus:outline-none focus:ring-1 focus:ring-[#28363b] focus:border-[#28363b] resize-y transition-colors leading-relaxed"
          />
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <GlassButton
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={!form.title.trim() || !form.message.trim() || submitting}
            className="gap-2 text-xs font-semibold px-4"
          >
            <Send size={13} />
            <span>Send Announcement</span>
          </GlassButton>
        </div>
      </form>
    </GlassCard>
  );
}
