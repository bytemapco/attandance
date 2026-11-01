"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { SetupStatus } from "@/types/setupStatus";

interface UseSetupStatus {
  status: SetupStatus | null;
  loading: boolean;
  failed: boolean;
  refresh: () => Promise<void>;
}

/** Loads the institution's setup progress. `refresh` re-reads it after the admin changes something. */
export function useSetupStatus(): UseSetupStatus {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<SetupStatus>("/admin/setup-status");
      setStatus(data);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, failed, refresh };
}
