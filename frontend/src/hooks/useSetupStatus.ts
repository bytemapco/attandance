"use client";

import useSWR from "swr";
import type { SetupStatus } from "@/types/setupStatus";

interface UseSetupStatus {
  status: SetupStatus | null;
  loading: boolean;
  failed: boolean;
  refresh: () => Promise<void>;
}

/** Loads the institution's setup progress. `refresh` re-reads it after the admin changes something. */
export function useSetupStatus(): UseSetupStatus {
  const { data, error, isLoading, mutate } = useSWR<SetupStatus>("/admin/setup-status");

  return {
    status: data ?? null,
    loading: isLoading,
    failed: Boolean(error) && !data,
    refresh: async () => {
      await mutate();
    },
  };
}
