import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { UseFormSetError } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyValidationErrorsToForm, getApiErrorMessage } from "@/lib/api/errors";
import { getApiBaseUrl } from "@/lib/config";
import { stubWindowLocation } from "../helpers";

function axiosError(data: unknown, status = 400): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, null, {
    data,
    status,
    statusText: "",
    headers: {},
    config,
  });
}

describe("getApiErrorMessage", () => {
  it("uses the server's detail text", () => {
    expect(getApiErrorMessage(axiosError({ detail: "Class not found." }))).toBe("Class not found.");
  });

  it("uses the first message of a validation list", () => {
    expect(getApiErrorMessage(axiosError({ detail: [{ msg: "Field required" }, { msg: "other" }] }))).toBe("Field required");
  });

  it("falls back when the first validation entry has no message", () => {
    expect(getApiErrorMessage(axiosError({ detail: [{}] }), "Check the form")).toBe("Check the form");
  });

  it("prefers the first field problem of the standard error envelope", () => {
    const body = { error: { message: "Validation failed", details: [{ field: "email", issue: "already used" }] } };
    expect(getApiErrorMessage(axiosError(body))).toBe("email: already used");
  });

  it("uses the envelope message when there are no field problems", () => {
    expect(getApiErrorMessage(axiosError({ error: { message: "A record already exists." } }))).toBe("A record already exists.");
  });

  it("reads a plain message field", () => {
    expect(getApiErrorMessage(axiosError({ message: "Nope" }))).toBe("Nope");
  });

  it("uses the network error text when the server sent no body", () => {
    expect(getApiErrorMessage(axiosError(undefined))).toBe("Request failed");
  });

  it("handles ordinary errors and unknown values", () => {
    expect(getApiErrorMessage(new Error("Boom"))).toBe("Boom");
    expect(getApiErrorMessage("weird", "Something broke")).toBe("Something broke");
    expect(getApiErrorMessage(null)).toBe("Something went wrong");
  });
});

describe("applyValidationErrorsToForm", () => {
  it("puts each server problem on its field and reports that it did", () => {
    const setError = vi.fn() as unknown as UseFormSetError<{ email: string; phone: string }>;
    const body = { error: { details: [{ field: "email", issue: "already used" }, { field: "phone", issue: "too short" }] } };

    expect(applyValidationErrorsToForm(axiosError(body), setError)).toBe(true);

    expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "already used" });
    expect(setError).toHaveBeenCalledWith("phone", { type: "server", message: "too short" });
  });

  it("returns false and touches nothing when there are no field problems", () => {
    const setError = vi.fn() as unknown as UseFormSetError<{ email: string }>;

    expect(applyValidationErrorsToForm(axiosError({ detail: "x" }), setError)).toBe(false);
    expect(applyValidationErrorsToForm(new Error("x"), setError)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});

describe("getApiBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function openedFrom(hostname: string): void {
    stubWindowLocation({ hostname });
  }

  it("uses the configured address as it is on localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000/api/v1");
    openedFrom("localhost");
    expect(getApiBaseUrl()).toBe("http://localhost:8000/api/v1");
  });

  it("points a localhost address at the page's host, so a phone on the same network works", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000/api/v1");
    openedFrom("192.168.1.20");
    expect(getApiBaseUrl()).toBe("http://192.168.1.20:8000/api/v1");
  });

  it("leaves a real production address alone", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.in/api/v1");
    openedFrom("app.example.in");
    expect(getApiBaseUrl()).toBe("https://api.example.in/api/v1");
  });
});
