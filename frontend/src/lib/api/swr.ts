import type { SWRConfiguration } from "swr";
import api from "./client";

/** An address, or an address with query parameters. `null` means "do not fetch yet". */
export type ApiKey = string | [string, Record<string, unknown>];

export async function apiFetcher<T>(key: ApiKey): Promise<T> {
  const [url, params] = typeof key === "string" ? [key, undefined] : key;
  const { data } = await api.get<T>(url, { params });
  return data;
}

function isClientError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status !== undefined && status >= 400 && status < 500;
}

export const swrDefaults: SWRConfiguration = {
  fetcher: apiFetcher,
  // The same read asked for by several components in a few seconds is one request.
  dedupingInterval: 5_000,
  // Coming back to the tab refreshes what is on screen, at most once every 30 s.
  revalidateOnFocus: true,
  focusThrottleInterval: 30_000,
  revalidateOnReconnect: true,
  // Paging and filtering keep showing the last page until the next one arrives.
  keepPreviousData: true,
  // A 4xx will not fix itself; only network trouble and 5xx are retried.
  shouldRetryOnError: (error) => !isClientError(error),
  errorRetryCount: 2,
};
