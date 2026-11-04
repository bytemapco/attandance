"use client";

import React from "react";
import Button from "@/components/ui/Button";

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
  success: "text-success",
  neutral: "text-muted-foreground",
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
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 rounded-lg border border-border-strong bg-card">
      <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
        <h2 id={`${id}-title`} className="text-sm font-semibold text-foreground">{title}</h2>
        {status && <span className={`text-xs font-medium ${TONE[status.tone]}`}>{status.label}</span>}
      </header>

      <div className="p-5">{children}</div>

      {dirty && (
        <footer className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="ghost" size="sm" disabled={saving} onClick={onDiscard}>
            Discard
          </Button>
          <Button variant="primary" size="sm" loading={saving} onClick={onSave}>
            Save
          </Button>
        </footer>
      )}
    </section>
  );
}
