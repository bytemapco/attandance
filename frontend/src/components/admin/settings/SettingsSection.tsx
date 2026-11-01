"use client";

import React from "react";
import GlassButton from "@/components/ui/GlassButton";

export interface SectionStatus {
  label: string;
  tone: "success" | "neutral";
}

interface SettingsSectionProps {
  id: string;
  title: string;
  status?: SectionStatus;
  dirty: boolean;
  saving?: boolean;
  onSave: () => void;
  onDiscard: () => void;
  children: React.ReactNode;
}

const TONE: Record<SectionStatus["tone"], string> = {
  success: "text-[#247653]",
  neutral: "text-[#526f78]",
};

/** One settings group. Save and Discard appear only when the section has unsaved changes. */
export default function SettingsSection({
  id,
  title,
  status,
  dirty,
  saving = false,
  onSave,
  onDiscard,
  children,
}: SettingsSectionProps): React.ReactElement {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 rounded-xl border border-[#d9d5cd] bg-white">
      <header className="flex items-center justify-between gap-4 border-b border-[#e6e2da] px-5 py-3.5">
        <h2 id={`${id}-title`} className="text-sm font-semibold text-[#202b30]">{title}</h2>
        {status && <span className={`text-xs font-medium ${TONE[status.tone]}`}>{status.label}</span>}
      </header>

      <div className="p-5">{children}</div>

      {dirty && (
        <footer className="flex justify-end gap-2 border-t border-[#e6e2da] px-5 py-3">
          <GlassButton variant="ghost" size="sm" disabled={saving} onClick={onDiscard}>
            Discard
          </GlassButton>
          <GlassButton variant="primary" size="sm" loading={saving} onClick={onSave}>
            Save
          </GlassButton>
        </footer>
      )}
    </section>
  );
}
