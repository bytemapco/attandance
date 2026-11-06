"use client";

import React, { useEffect } from "react";
import { SWRConfig, useSWRConfig } from "swr";
import { bindCache } from "@/lib/api/cache";
import { swrDefaults } from "@/lib/api/swr";
import { useAuthStore } from "@/store/authStore";

function CacheBinding(): null {
  const { mutate } = useSWRConfig();
  useEffect(() => {
    bindCache(mutate);
    return () => bindCache(null);
  }, [mutate]);
  return null;
}

/**
 * One cache per signed-in user. Signing out, or in as someone else, starts an empty cache, so the next person
 * never sees the last one's data and no half-finished request leaks across.
 */
export default function SwrProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const userId = useAuthStore((state) => state.user?.id ?? "signed-out");
  return (
    <SWRConfig key={userId} value={{ ...swrDefaults, provider: () => new Map() }}>
      <CacheBinding />
      {children}
    </SWRConfig>
  );
}
