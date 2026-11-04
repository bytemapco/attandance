"use client";

import React from "react";

interface RangeSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Text shown beside the label, for example "50 m". */
  valueLabel: string;
  minLabel?: string;
  maxLabel?: string;
  onChange: (value: number) => void;
}

/** Native range input, so keyboard and screen-reader behaviour come from the browser. */
export default function RangeSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  valueLabel,
  minLabel,
  maxLabel,
  onChange,
}: RangeSliderProps): React.ReactElement {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <label htmlFor={id} className="font-medium text-foreground">
          {label}
        </label>
        <span className="font-semibold tabular-nums text-foreground">{valueLabel}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
      />
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
