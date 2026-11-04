"use client";

import React from "react";
import type { SystemConfig } from "@/types/systemConfig";
import RangeSlider from "@/components/ui/RangeSlider";

export interface AttendanceRules {
  minAttendancePct: number;
  verificationWindowMin: number;
  saturdayEnabled: boolean;
}

export function rulesOf(config: SystemConfig): AttendanceRules {
  return {
    minAttendancePct: config.minAttendancePct,
    verificationWindowMin: config.verificationWindowMin,
    saturdayEnabled: config.saturdayEnabled,
  };
}

export function sameRules(a: AttendanceRules, b: AttendanceRules): boolean {
  return (
    a.minAttendancePct === b.minAttendancePct &&
    a.verificationWindowMin === b.verificationWindowMin &&
    a.saturdayEnabled === b.saturdayEnabled
  );
}

interface AttendanceRulesFieldsProps {
  value: AttendanceRules;
  onChange: (next: AttendanceRules) => void;
}

/** The three institution-wide attendance rules. Controlled: the parent decides when to save. */
export default function AttendanceRulesFields({ value, onChange }: AttendanceRulesFieldsProps): React.ReactElement {
  return (
    <div className="space-y-5">
      <RangeSlider
        id="min-attendance"
        label="Minimum attendance"
        value={value.minAttendancePct}
        min={50}
        max={100}
        step={5}
        valueLabel={`${value.minAttendancePct}%`}
        minLabel="50%"
        maxLabel="100%"
        onChange={(next) => onChange({ ...value, minAttendancePct: next })}
      />
      <RangeSlider
        id="verification-window"
        label="Attendance open for"
        value={value.verificationWindowMin}
        min={15}
        max={120}
        step={5}
        valueLabel={`${value.verificationWindowMin} min`}
        minLabel="15 min"
        maxLabel="2 h"
        onChange={(next) => onChange({ ...value, verificationWindowMin: next })}
      />
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          className="h-4 w-4 rounded-sm border-border-strong"
          checked={value.saturdayEnabled}
          onChange={(event) => onChange({ ...value, saturdayEnabled: event.target.checked })}
        />
        Saturday is a teaching day
      </label>
    </div>
  );
}
