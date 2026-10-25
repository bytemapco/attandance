import { describe, it, expect, vi } from "vitest";
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { getApiErrorMessage, applyValidationErrorsToForm } from "@/lib/api";

function createAxiosError(status: number, data: unknown): AxiosError {
  const error = new AxiosError("Request failed with status code " + status);
  error.response = {
    data,
    status,
    statusText: "Error",
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  } as AxiosResponse;
  return error;
}

describe("getApiErrorMessage", () => {
  it("extracts structured error details when details array is provided", () => {
    const error = createAxiosError(422, {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid payload",
        details: [{ field: "email", issue: "Must be a valid email" }],
      },
    });

    const message = getApiErrorMessage(error);
    expect(message).toBe("email: Must be a valid email");
  });

  it("extracts error message when details array is empty", () => {
    const error = createAxiosError(400, {
      error: {
        code: "BAD_REQUEST",
        message: "Operation not permitted",
        details: [],
      },
    });

    const message = getApiErrorMessage(error);
    expect(message).toBe("Operation not permitted");
  });

  it("extracts string detail from FastAPI standard error response", () => {
    const error = createAxiosError(403, {
      detail: "Access denied: Insufficient permissions",
    });

    const message = getApiErrorMessage(error);
    expect(message).toBe("Access denied: Insufficient permissions");
  });

  it("extracts message from FastAPI standard validation array", () => {
    const error = createAxiosError(422, {
      detail: [{ msg: "field required", loc: ["body", "password"] }],
    });

    const message = getApiErrorMessage(error);
    expect(message).toBe("field required");
  });

  it("handles standard Error instances", () => {
    const standardError = new Error("Network timeout");
    expect(getApiErrorMessage(standardError)).toBe("Network timeout");
  });

  it("returns fallback for unknown non-error types", () => {
    expect(getApiErrorMessage(null, "Default fallback")).toBe("Default fallback");
    expect(getApiErrorMessage(undefined, "Default fallback")).toBe("Default fallback");
  });
});

describe("applyValidationErrorsToForm", () => {
  it("maps backend validation details to react-hook-form setError", () => {
    const setError = vi.fn();
    const error = createAxiosError(422, {
      error: {
        details: [
          { field: "email", issue: "Email already taken" },
          { field: "password", issue: "Password too weak" },
        ],
      },
    });

    const result = applyValidationErrorsToForm(error, setError);
    expect(result).toBe(true);
    expect(setError).toHaveBeenCalledTimes(2);
    expect(setError).toHaveBeenCalledWith("email", {
      type: "server",
      message: "Email already taken",
    });
    expect(setError).toHaveBeenCalledWith("password", {
      type: "server",
      message: "Password too weak",
    });
  });

  it("returns false for non-axios errors", () => {
    const setError = vi.fn();
    const result = applyValidationErrorsToForm(new Error("Generic error"), setError);
    expect(result).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
