import axios from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

export interface ApiValidationErrorDetail {
  field: string;
  issue: string;
}

export interface ApiValidationErrorEnvelope {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: ApiValidationErrorDetail[];
  };
}

interface ApiErrorBody {
  detail?: string | Array<{ msg?: string }>;
  message?: string;
  error?: {
    message?: string;
    details?: ApiValidationErrorDetail[];
  };
}

function messageFromBody(body: ApiErrorBody, fallback: string): string | null {
  if (body.error?.message) {
    const firstIssue = body.error.details?.[0];
    return firstIssue ? `${firstIssue.field}: ${firstIssue.issue}` : body.error.message;
  }
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail) && body.detail.length > 0) return body.detail[0]?.msg || fallback;
  return body.message ?? null;
}

export function getApiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    const fromBody = body ? messageFromBody(body, fallback) : null;
    return fromBody ?? (err.message || fallback);
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function applyValidationErrorsToForm<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>
): boolean {
  if (!axios.isAxiosError(err)) return false;
  const details = (err.response?.data as ApiErrorBody | undefined)?.error?.details;
  if (!Array.isArray(details) || details.length === 0) return false;

  for (const item of details) {
    if (item.field && item.issue) {
      setError(item.field as Path<T>, { type: "server", message: item.issue });
    }
  }
  return true;
}
