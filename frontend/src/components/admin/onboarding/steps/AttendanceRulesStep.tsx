"use client";

import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import type { SystemConfig } from "@/types/systemConfig";
import ErrorState from "@/components/ui/ErrorState";
import AttendanceRulesFields, { rulesOf, sameRules, type AttendanceRules } from "../../settings/AttendanceRulesFields";
import type { StepProps } from "./stepProps";

/** Institution-wide attendance rules. Continue saves them if they changed. */
export default function AttendanceRulesStep({ registerContinueAction }: StepProps): React.ReactElement {
  const [rules, setRules] = useState<AttendanceRules | null>(null);
  const [savedRules, setSavedRules] = useState<AttendanceRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const { data } = await api.get<SystemConfig>("/admin/config");
      const current = rulesOf(data);
      setRules(current);
      setSavedRules(current);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveStep = useCallback(async (): Promise<boolean> => {
    if (!rules || !savedRules) return false;
    if (sameRules(rules, savedRules)) return true;
    try {
      await api.patch("/admin/config", {
        minAttendancePct: rules.minAttendancePct,
        verificationWindowMin: rules.verificationWindowMin,
        saturdayEnabled: rules.saturdayEnabled,
      });
      setSavedRules(rules);
      return true;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not save the attendance rules"));
      return false;
    }
  }, [rules, savedRules]);

  useEffect(() => {
    if (loading || loadFailed) {
      registerContinueAction(null);
      return;
    }
    registerContinueAction(saveStep);
    return () => registerContinueAction(null);
  }, [loading, loadFailed, saveStep, registerContinueAction]);

  if (loading) return <p role="status" className="text-sm text-muted-foreground">Loading…</p>;
  if (loadFailed || !rules) {
    return <ErrorState title="Could not load the attendance rules" message="Nothing has been changed." retryLabel="Reload" className="p-5 sm:p-8" onRetry={() => void load()} />;
  }

  return <AttendanceRulesFields value={rules} onChange={setRules} />;
}
