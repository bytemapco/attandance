"use client";

import React from "react";
import { Users } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import type { NotificationBroadcastCreate, NotificationCategory, NotificationType } from "@/types/notification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BroadcastTargetSectionProps {
  formData: NotificationBroadcastCreate;
  onChange: (data: NotificationBroadcastCreate) => void;
}

const AUDIENCE_OPTIONS: { id: "ALL" | "STUDENT" | "TEACHER" | "ADMIN"; label: string; desc: string }[] = [
  { id: "ALL", label: "All Campus Users", desc: "Students, Teachers, and Staff" },
  { id: "STUDENT", label: "Students Only", desc: "All enrolled students" },
  { id: "TEACHER", label: "Faculty Only", desc: "Active teaching staff" },
  { id: "ADMIN", label: "Administrators", desc: "Institutional managers" },
];

export default function BroadcastTargetSection({
  formData,
  onChange,
}: BroadcastTargetSectionProps): React.ReactElement {
  return (
    <GlassCard className="p-5 bg-card border border-[#e3e1dc] space-y-4 shadow-2xs">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#e3e1dc]">
        <div className="p-1.5 rounded-xl bg-[#306b8a]/10 text-[#306b8a] border border-[#306b8a]/20">
          <Users size={16} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#28363b]">Target Audience & Delivery Classification</h2>
          <p className="text-xs text-[#526f78]">Specify recipient group, priority urgency, and category tag.</p>
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold text-[#28363b] block mb-2">
          Target Recipient Group <span className="text-[#b54242]">*</span>
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {AUDIENCE_OPTIONS.map((opt) => {
            const isSelected = (formData.target_role || "ALL") === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ ...formData, target_role: opt.id })}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white text-[#28363b] border-[#c98260] ring-1 ring-[#c98260] shadow-xs"
                    : "bg-[#f5f2ed] border-[#e3e1dc] text-[#526f78] hover:text-[#28363b] hover:bg-[#eeece7]"
                }`}
              >
                <p className="text-xs font-semibold leading-tight">{opt.label}</p>
                <p className="text-[10px] text-[#526f78] mt-0.5 leading-tight">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="text-xs font-semibold text-[#28363b] block mb-1">
            Priority / Urgency
          </label>
          <Select
            value={formData.type || "info"}
            onValueChange={(val) => onChange({ ...formData, type: val as NotificationType })}
          >
            <SelectTrigger className="w-full h-9 text-xs border-[#e3e1dc] text-[#28363b]">
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
          <label className="text-xs font-semibold text-[#28363b] block mb-1">
            Category Tag
          </label>
          <Select
            value={formData.category || "system"}
            onValueChange={(val) => onChange({ ...formData, category: val as NotificationCategory })}
          >
            <SelectTrigger className="w-full h-9 text-xs border-[#e3e1dc] text-[#28363b]">
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
  );
}
