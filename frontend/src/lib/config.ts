const LOCAL_API_URL = "http://localhost:8000/api/v1";
const LOCAL_WS_URL = "ws://localhost:8000/ws/connect";
const LOCAL_HOST = "localhost";

export const AUTH_STORAGE_KEY = "sas-auth-storage";
export const TENANT_STORAGE_KEY = "sas-tenant-id";

export const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || "default-institution";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? LOCAL_WS_URL;

/**
 * The API address for the current browser. A `localhost` address is pointed at the page's own host,
 * so the app also works when it is opened from another device on the same network.
 */
export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL || LOCAL_API_URL;
  if (typeof window === "undefined" || window.location.hostname === LOCAL_HOST) return configured;
  return configured.replace(LOCAL_HOST, window.location.hostname);
}
