import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { SystemConfig } from "@/types/systemConfig";

interface UseCampusLocationSettingsResult {
  loading: boolean;
  failed: boolean;
  reload: () => Promise<void>;
}

export function useCampusLocationSettings(onLoaded: (settings: SystemConfig) => void): UseCampusLocationSettingsResult {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setFailed(false);
    try {
      const { data } = await api.get<SystemConfig>("/admin/config");
      onLoaded(data);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [onLoaded]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { loading, failed, reload };
}
