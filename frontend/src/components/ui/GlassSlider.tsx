"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface GlassSliderProps {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  className?: string;
}

export default function GlassSlider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  unit = "",
  className = "",
}: GlassSliderProps): React.ReactElement {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      {label && (
        <div className="flex items-center justify-between text-xs font-medium">
          <label className="text-foreground">{label}</label>
          <span className="font-semibold text-foreground">
            {value}
            {unit}
          </span>
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-secondary"
          style={{
            background: `linear-gradient(to right, #0f172a 0%, #0f172a ${percent}%, #e2e8f0 ${percent}%, #e2e8f0 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
