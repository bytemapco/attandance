"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import type { OccurrenceRegisterData } from "@/types";
import { occurrenceState } from "../occurrenceState";
import type { Edits } from "./registerStatus";

const LIVE_REFRESH_MS = 5000;

/** Loads a class's register and keeps it fresh while attendance is live. */
export function useRegisterData(occurrenceId: string) {
  const base = `/faculty/occurrences/${occurrenceId}`;
  const [register, setRegister] = useState<OccurrenceRegisterData | null>(null);
  const [edits, setEdits] = useState<Edits>({});
  const [failed, setFailed] = useState(false);

  /** A full reload. It drops the teacher's unsaved edits, so use it after saving. */
  const load = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<OccurrenceRegisterData>(`${base}/register`);
      setRegister(data);
      setEdits({});
      setFailed(false);
    } catch (err: unknown) {
      setFailed(true);
      toast.error(getApiErrorMessage(err, "Could not load the attendance register"));
    }
  }, [base]);

  /** Fetches the register without touching unsaved edits. */
  const refresh = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<OccurrenceRegisterData>(`${base}/register`);
      setRegister(data);
    } catch {
      // The next refresh tries again.
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  const live = register ? occurrenceState(register) === "LIVE" : false;
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => void refresh(), LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [live, refresh]);

  return { base, register, edits, setEdits, failed, load, refresh };
}
