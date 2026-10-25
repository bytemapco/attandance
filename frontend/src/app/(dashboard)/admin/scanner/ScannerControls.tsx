"use client";

import React, { useState } from "react";
import { ScanSearch, SlidersHorizontal } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassButton from "@/components/ui/GlassButton";

interface ScannerControlsProps {
  contamination: number;
  onContaminationChange: (val: number) => void;
  onRunScan: () => void;
  loading: boolean;
}

interface Preset {
  id: string;
  label: string;
  value: number;
  hint: string;
}

const PRESETS: Preset[] = [
  { id: "strict", label: "Strict (5%)", value: 0.05, hint: "Top 5% highest risk" },
  { id: "balanced", label: "Balanced (10%)", value: 0.1, hint: "Top 10% regular absences" },
  { id: "broad", label: "Broad (20%)", value: 0.2, hint: "Top 20% early notice" },
];

export default function ScannerControls({
  contamination,
  onContaminationChange,
  onRunScan,
  loading,
}: ScannerControlsProps): React.ReactElement {
  const [showSlider, setShowSlider] = useState<boolean>(false);

  const activePreset = PRESETS.find(
    (p) => Math.abs(p.value - contamination) < 0.001
  );

  const currentPercent = Math.round(contamination * 100);

  function handleSelect(preset: Preset): void {
    setShowSlider(false);
    onContaminationChange(preset.value);
  }

  return (
    <GlassCard className="bg-card border-border/80 p-3 sm:p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Sensitivity Segmented Control */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">Sensitivity:</span>
          <div className="inline-flex rounded-xl bg-secondary/80 p-0.5 border border-border/40">
            {PRESETS.map((preset) => {
              const isSelected = !showSlider && activePreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelect(preset)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all text-center ${
                    isSelected
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowSlider((prev) => !prev)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              showSlider
                ? "bg-secondary text-foreground border-border"
                : "text-muted-foreground hover:text-foreground border-transparent hover:border-border/60"
            }`}
            title="Custom percentage"
          >
            <SlidersHorizontal size={14} />
          </button>

          <span className="text-xs text-muted-foreground hidden md:inline-block ml-1">
            {showSlider ? `Custom: ${currentPercent}%` : activePreset?.hint}
          </span>
        </div>

        {/* Right: Primary Scan Button */}
        <div className="shrink-0">
          <GlassButton
            variant="primary"
            size="md"
            loading={loading}
            onClick={onRunScan}
            icon={<ScanSearch size={15} />}
            className="w-full sm:w-auto font-medium"
          >
            {loading ? "Scanning..." : "Run Scan"}
          </GlassButton>
        </div>
      </div>

      {/* Collapsible Fine-Tune Slider */}
      {showSlider && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-3 text-xs">
          <span className="text-muted-foreground shrink-0">Threshold:</span>
          <input
            type="range"
            min={0.01}
            max={0.5}
            step={0.01}
            value={contamination}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onContaminationChange(Number(e.target.value))
            }
            className="w-full max-w-xs h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-foreground"
          />
          <span className="font-mono font-bold text-foreground shrink-0">{currentPercent}%</span>
          <span className="text-muted-foreground text-[11px]">(Flags top {currentPercent}%)</span>
        </div>
      )}
    </GlassCard>
  );
}
