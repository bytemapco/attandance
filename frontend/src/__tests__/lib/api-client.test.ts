import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { TENANT_STORAGE_KEY } from "@/lib/config";
import { useAuthStore } from "@/store/authStore";
import { makeUser, stubWindowLocation } from "../helpers";

interface Reply {
  status: number;
  data?: unknown;
}

let lastRequest: InternalAxiosRequestConfig | null = null;
let reply: Reply = { status: 200, data: {} };
let fakeLocation: { pathname: string; hostname: string; href: string };

function installAdapter(): void {
  api.defaults.adapter = async (config) => {
    lastRequest = config;
    const response = { data: reply.data, status: reply.status, statusText: "", headers: {}, config };
    if (reply.status >= 400) throw new AxiosError("failed", "ERR_BAD_REQUEST", config, null, response);
    return response;
  };
}

async function call(url: string): Promise<void> {
  await api.get(url).catch(() => undefined);
}

beforeEach(() => {
  lastRequest = null;
  reply = { status: 200, data: {} };
  fakeLocation = stubWindowLocation({ pathname: "/teacher/today", hostname: "localhost", href: "" });
  localStorage.clear();
  useAuthStore.getState().logout();
  installAdapter();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("request headers", () => {
  it("sends the bearer token once signed in", async () => {
    useAuthStore.getState().login("jwt-1", makeUser());
    await call("/things");
    expect(lastRequest?.headers.Authorization).toBe("Bearer jwt-1");
  });

  it("keeps a token the caller sets, so a new login is not read with the previous session's token", async () => {
    useAuthStore.getState().login("old-session-jwt", makeUser());

    await api.get("/auth/me", { headers: { Authorization: "Bearer new-login-jwt" } });

    expect(lastRequest?.headers.Authorization).toBe("Bearer new-login-jwt");
  });

  it("keeps an institution the caller names", async () => {
    useAuthStore.getState().login("jwt-1", makeUser({ tenant_id: "tenant-9" }));

    await api.get("/things", { headers: { "X-Tenant-ID": "tenant-explicit" } });

    expect(lastRequest?.headers["X-Tenant-ID"]).toBe("tenant-explicit");
  });

  it("sends no Authorization header when signed out", async () => {
    await call("/things");
    expect(lastRequest?.headers.Authorization).toBeUndefined();
  });

  it("names the institution from the signed-in user", async () => {
    useAuthStore.getState().login("jwt-1", makeUser({ tenant_id: "tenant-9" }));
    await call("/things");
    expect(lastRequest?.headers["X-Tenant-ID"]).toBe("tenant-9");
  });

  it("uses the remembered institution before login, such as on the login page", async () => {
    localStorage.setItem(TENANT_STORAGE_KEY, "remembered-tenant");
    await call("/auth/login");
    expect(lastRequest?.headers["X-Tenant-ID"]).toBe("remembered-tenant");
  });

  it("falls back to the default institution when nothing is known", async () => {
    await call("/things");
    expect(lastRequest?.headers["X-Tenant-ID"]).toBe("default-institution");
  });
});

describe("an expired session (401)", () => {
  it("signs the user out and sends them to the login page", async () => {
    useAuthStore.getState().login("jwt-1", makeUser());
    reply = { status: 401, data: { detail: "Token expired" } };

    await call("/classes");

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(fakeLocation.href).toBe("/login");
  });

  it("does not redirect when already on the login page", async () => {
    fakeLocation.pathname = "/login";
    reply = { status: 401 };

    await call("/classes");

    expect(fakeLocation.href).toBe("");
  });

  it.each(["/auth/login", "/auth/forgot-password", "/auth/reset-password", "/auth/verify-token"])(
    "keeps the user where they are when %s itself answers 401",
    async (url) => {
      useAuthStore.getState().login("jwt-1", makeUser());
      reply = { status: 401, data: { detail: "Invalid credentials" } };

      await call(url);

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(fakeLocation.href).toBe("");
    },
  );

  it("still rejects, so the caller can show the error", async () => {
    reply = { status: 401, data: { detail: "Token expired" } };
    await expect(api.get("/classes")).rejects.toMatchObject({ response: { status: 401 } });
  });
});

describe("a suspended institution (403)", () => {
  it("records the suspension and sends the user to the suspended page", async () => {
    reply = { status: 403, data: { detail: "Tenant account is currently suspended." } };

    await call("/classes");

    expect(useAuthStore.getState()).toMatchObject({
      isSuspended: true,
      suspensionReason: "Tenant account is currently suspended.",
    });
    expect(fakeLocation.href).toBe("/suspended");
  });

  it("shows the notice on the login page without redirecting away from it", async () => {
    reply = { status: 403, data: { detail: "Your institution is suspended" } };

    await call("/auth/login");

    expect(useAuthStore.getState().isSuspended).toBe(true);
    expect(fakeLocation.href).toBe("");
  });

  it("treats an ordinary 403 as a permission error and leaves the session alone", async () => {
    useAuthStore.getState().login("jwt-1", makeUser());
    reply = { status: 403, data: { detail: "You are not assigned to this class." } };

    await call("/classes");

    expect(useAuthStore.getState()).toMatchObject({ isSuspended: false, isAuthenticated: true });
    expect(fakeLocation.href).toBe("");
  });
});
