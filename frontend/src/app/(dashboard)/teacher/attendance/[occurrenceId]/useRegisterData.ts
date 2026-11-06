"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api";
import { LIVE_REGISTER_POLL_MS } from "@/lib/polling";
import type { OccurrenceRegisterData } from "@/types";
import { occurrenceState } from "../occurrenceState";
import type { Edits } from "./registerStatus";

/** Loads a class's register and keeps it fresh while attendance is live (and the tab is visible). */
export function useRegisterData(occurrenceId: string) {
  const base = `/faculty/occurrences/${occurrenceId}`;
  const [edits, setEdits] = useState<Edits>({});

  const { data: register = null, error, mutate } = useSWR<OccurrenceRegisterData>(`${base}/register`, {
    // Only a live class changes under the teacher; SWR also stops this while the tab is hidden.
    refreshInterval: (current) => (current && occurrenceState(current) === "LIVE" ? LIVE_REGISTER_POLL_MS : 0),
  });
  const failed = Boolean(error) && !register;

  useEffect(() => {
    if (error && !register) toast.error(getApiErrorMessage(error, "Could not load the attendance register"));
  }, [error, register]);

  /** A full reload. It drops the teacher's unsaved edits, so use it after saving. */
  const load = useCallback(async (): Promise<void> => {
    await mutate();
    setEdits({});
  }, [mutate]);

  /** Fetches the register without touching unsaved edits. */
  const refresh = useCallback(async (): Promise<void> => {
    await mutate();
  }, [mutate]);

  return { base, register, edits, setEdits, failed, load, refresh };
}
