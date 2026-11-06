import type { ScopedMutator } from "swr";

/** The first path segment of an API address: "/admin/departments/3" -> "admin". */
function scopeOf(url: string): string {
  return url.split("?")[0].split("/")[1] ?? "";
}

/** The address a cache key stands for. A key is an address, or [address, query parameters]. */
export function addressOfKey(key: unknown): string {
  if (typeof key === "string") return key;
  if (Array.isArray(key) && typeof key[0] === "string") return key[0];
  return "";
}

// Writes to these never change what a cached read shows.
const UNRELATED_SCOPES = new Set(["auth", "logs", ""]);

// The API client lives outside React, so the provider hands it the cache's own `mutate`.
let cacheMutate: ScopedMutator | null = null;

export function bindCache(mutate: ScopedMutator | null): void {
  cacheMutate = mutate;
}

/**
 * After a successful write, re-reads whatever is cached from the same part of the API ("/admin/...", "/faculty/...").
 * Only the reads on screen refetch at once; the rest are refetched the next time they are used.
 */
export function revalidateAfterWrite(url: string | undefined): void {
  const scope = scopeOf(url ?? "");
  if (UNRELATED_SCOPES.has(scope) || !cacheMutate) return;
  void cacheMutate((key) => scopeOf(addressOfKey(key)) === scope, undefined, { revalidate: true });
}
