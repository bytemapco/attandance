"use client";

import { useEffect, useState } from "react";
import api, { getApiErrorMessage } from "@/lib/api";
import type { ReportParams } from "@/types";

interface ReportState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/** Loads one report and reloads it whenever the filters change. `path` null means "not ready to load". */
export function useReport<T>(path: string | null, params: ReportParams): ReportState<T> {
  const [state, setState] = useState<ReportState<T>>({ data: null, loading: path !== null, error: null });
  const key = JSON.stringify(params);

  useEffect(() => {
    if (path === null) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    api
      .get<T>(path, { params: JSON.parse(key) as ReportParams })
      .then(({ data }) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ data: null, loading: false, error: getApiErrorMessage(err, "Could not load the report") });
      });
    return () => {
      cancelled = true;
    };
  }, [path, key]);

  return state;
}
