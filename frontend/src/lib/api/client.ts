import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { revalidateAfterWrite } from "@/lib/api/cache";
import { DEFAULT_TENANT_ID, TENANT_STORAGE_KEY, getApiBaseUrl } from "@/lib/config";
import { useAuthStore } from "@/store/authStore";

const REQUEST_TIMEOUT_MS = 60000;
const LOGIN_PATH = "/login";
const SUSPENDED_PATH = "/suspended";
const LOGIN_REQUEST = "/auth/login";
const PUBLIC_AUTH_REQUESTS = [LOGIN_REQUEST, "/auth/forgot-password", "/auth/reset-password", "/auth/verify-token"];

function currentTenantId(): string {
  const { tenantId, user } = useAuthStore.getState();
  const remembered = typeof window !== "undefined" ? localStorage.getItem(TENANT_STORAGE_KEY) : null;
  return tenantId || user?.tenant_id || user?.tenant_slug || remembered || DEFAULT_TENANT_ID;
}

function attachSession(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const { token } = useAuthStore.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["X-Tenant-ID"] = currentTenantId();
  return config;
}

function isSuspensionNotice(detail: string): boolean {
  const text = detail.toLowerCase();
  return text.includes("suspended") || text.includes("suspension");
}

function leaveTo(path: string): void {
  if (typeof window !== "undefined" && !window.location.pathname.startsWith(path)) {
    window.location.href = path;
  }
}

function handleSuspension(error: AxiosError, detail: string): void {
  useAuthStore.getState().setSuspended(true, detail);
  if (!(error.config?.url || "").includes(LOGIN_REQUEST)) leaveTo(SUSPENDED_PATH);
}

function handleExpiredSession(error: AxiosError): void {
  const requestUrl = error.config?.url || "";
  if (PUBLIC_AUTH_REQUESTS.some((path) => requestUrl.includes(path))) return;
  useAuthStore.getState().logout();
  leaveTo(LOGIN_PATH);
}

function handleResponseError(error: AxiosError<{ detail?: string }>): Promise<never> {
  const status = error.response?.status;
  const detail = error.response?.data?.detail ?? "";

  if (status === 403 && typeof window !== "undefined" && isSuspensionNotice(detail)) {
    handleSuspension(error, detail);
  } else if (status === 401) {
    handleExpiredSession(error);
  }
  return Promise.reject(error);
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
  timeout: REQUEST_TIMEOUT_MS,
});

function refreshReadsAfterWrite(response: AxiosResponse): AxiosResponse {
  if (response.config.method !== "get") revalidateAfterWrite(response.config.url);
  return response;
}

api.interceptors.request.use(attachSession);
api.interceptors.response.use(refreshReadsAfterWrite, handleResponseError);

export default api;
