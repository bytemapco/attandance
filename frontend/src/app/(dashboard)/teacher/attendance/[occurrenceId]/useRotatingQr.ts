"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { OccurrenceQrData } from "@/types";

const RETRY_MS = 3000;

export function useRotatingQr(occurrenceId: string, enabled: boolean): { qr: OccurrenceQrData | null; failed: boolean } {
  const [qr, setQr] = useState<OccurrenceQrData | null>(null);
  const [failed, setFailed] = useState(false);

  const fetchQr = useCallback(async (): Promise<number> => {
    try {
      const { data } = await api.get<OccurrenceQrData>(`/faculty/occurrences/${occurrenceId}/qr`);
      setQr(data);
      setFailed(false);
      return data.refresh_interval_seconds * 1000;
    } catch {
      setFailed(true);
      return RETRY_MS;
    }
  }, [occurrenceId]);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    let active = true;
    const tick = async (): Promise<void> => {
      const delay = await fetchQr();
      if (active) timer = setTimeout(() => void tick(), delay);
    };
    void tick();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [fetchQr, enabled]);

  return { qr, failed };
}
