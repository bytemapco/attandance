"use client";

import React from "react";
import { Radio, Play } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import type { AcademicClassWithGeofence } from "@/types";

interface StartSessionCardProps {
  classes: AcademicClassWithGeofence[];
  selectedClass: string;
  duration: string;
  starting: boolean;
  onClassChange: (val: string) => void;
  onDurationChange: (val: string) => void;
  onStart: () => void;
}

export default function StartSessionCard({
  classes,
  selectedClass,
  duration,
  starting,
  onClassChange,
  onDurationChange,
  onStart,
}: StartSessionCardProps): React.ReactElement {
  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-[#28363b]/10 text-[#28363b]">
          <Radio size={20} />
        </div>
        <h3 className="text-base font-semibold text-[#28363b]">Start New Session</h3>
      </div>
      <div className="space-y-4">
        <GlassSelect
          label="Class"
          options={classes.map((c) => ({
            value: c.id,
            label: c.subject ? `${c.name} • ${c.subject}` : c.name,
          }))}
          value={selectedClass}
          onChange={onClassChange}
          placeholder="Select class..."
        />
        <GlassInput
          label="Duration (minutes)"
          type="number"
          value={duration}
          onChange={(e) => onDurationChange(e.target.value)}
        />
        <GlassButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onStart}
          loading={starting}
          icon={<Play size={18} />}
        >
          Start Session
        </GlassButton>
      </div>
    </GlassCard>
  );
}
