"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import type { SystemConfig } from "@/types/systemConfig";
import ErrorState from "@/components/ui/ErrorState";
import SettingsSection from "./SettingsSection";
import AttendanceRulesFields, { rulesOf, sameRules, type AttendanceRules } from "./AttendanceRulesFields";

interface AttendanceRulesFormProps {
  /** Tells the page whether this section has unsaved edits, for the leave-page warning. */
  onDirtyChange?: (dirty: boolean) => void;
}

/** The institution-wide attendance rules, as a settings section with its own save bar. */
export default function AttendanceRulesForm({ onDirtyChange }: AttendanceRulesFormProps = {}): React.ReactElement {
  const [saved, setSaved] = useState<AttendanceRules | null>(null);
  const [draft, setDraft] = useState<AttendanceRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load(): Promise<void> {
    setLoading(true);
    setFailed(false);
    try {
      const { data } = await api.get<SystemConfig>("/admin/config");
      const rules = rulesOf(data);
      setSaved(rules);
      setDraft(rules);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const dirty = !!saved && !!draft && !sameRules(draft, saved);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  async function save(): Promise<void> {
    if (!draft) return;
    setSaving(true);
    try {
      await api.patch("/admin/config", {
        minAttendancePct: draft.minAttendancePct,
        verificationWindowMin: draft.verificationWindowMin,
        saturdayEnabled: draft.saturdayEnabled,
      });
      setSaved(draft);
      toast.success("Attendance rules saved");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not save the attendance rules"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p role="status" className="text-sm text-muted-foreground">Loading attendance rules…</p>;
  if (failed || !saved || !draft) {
    return <ErrorState title="Could not load attendance rules" message="Your saved rules are unchanged." retryLabel="Reload" className="p-5 sm:p-8" onRetry={() => void load()} />;
  }

  return (
    <SettingsSection
      id="attendance"
      title="Attendance rules"
      status={{ label: "Active", tone: "success" }}
      dirty={dirty}
      saving={saving}
      onSave={() => void save()}
      onDiscard={() => setDraft(saved)}
    >
      <AttendanceRulesFields value={draft} onChange={setDraft} />
    </SettingsSection>
  );
}
