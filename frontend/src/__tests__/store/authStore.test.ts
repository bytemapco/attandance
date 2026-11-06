import { beforeEach, describe, expect, it } from "vitest";
import { AUTH_STORAGE_KEY, TENANT_STORAGE_KEY } from "@/lib/config";
import { useAuthStore } from "@/store/authStore";
import { makeUser } from "../helpers";

function resetStore(): void {
  useAuthStore.getState().logout();
  document.cookie = `${AUTH_STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  localStorage.clear();
}

function storedCookie(): { state: { token: string | null; isAuthenticated: boolean } } | null {
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${AUTH_STORAGE_KEY}=`));
  return match ? JSON.parse(decodeURIComponent(match.split("=")[1])) : null;
}

beforeEach(resetStore);

describe("login", () => {
  it("stores the token and user and marks the session authenticated", () => {
    useAuthStore.getState().login("jwt-1", makeUser());

    const state = useAuthStore.getState();
    expect(state).toMatchObject({ token: "jwt-1", isAuthenticated: true, tenantId: "tenant-1" });
    expect(state.user?.email).toBe("teacher@college.in");
  });

  it("remembers the institution so the next visit can name it", () => {
    useAuthStore.getState().login("jwt-1", makeUser());
    expect(localStorage.getItem(TENANT_STORAGE_KEY)).toBe("tenant-1");
  });

  it("falls back to the tenant slug when the id is missing", () => {
    useAuthStore.getState().login("jwt-1", makeUser({ tenant_id: null, tenant_slug: "college" }));
    expect(useAuthStore.getState().tenantId).toBe("college");
  });

  it("clears an earlier suspension", () => {
    useAuthStore.getState().setSuspended(true, "Overdue");
    useAuthStore.getState().login("jwt-1", makeUser());
    expect(useAuthStore.getState()).toMatchObject({ isSuspended: false, suspensionReason: null });
  });

  it("persists the session in a cookie the route guard can read", () => {
    useAuthStore.getState().login("jwt-1", makeUser());
    expect(storedCookie()?.state).toMatchObject({ token: "jwt-1", isAuthenticated: true });
  });
});

describe("logout", () => {
  it("forgets the session and the remembered institution", () => {
    useAuthStore.getState().login("jwt-1", makeUser());
    useAuthStore.getState().logout();

    expect(useAuthStore.getState()).toMatchObject({ token: null, user: null, tenantId: null, isAuthenticated: false });
    expect(localStorage.getItem(TENANT_STORAGE_KEY)).toBeNull();
    expect(storedCookie()?.state.token ?? null).toBeNull();
  });
});

describe("suspension", () => {
  it("records the reason and defaults it to null", () => {
    useAuthStore.getState().setSuspended(true, "Licence expired");
    expect(useAuthStore.getState()).toMatchObject({ isSuspended: true, suspensionReason: "Licence expired" });

    useAuthStore.getState().setSuspended(false);
    expect(useAuthStore.getState()).toMatchObject({ isSuspended: false, suspensionReason: null });
  });
});

describe("profile updates", () => {
  it("replaces the user and re-remembers the institution", () => {
    useAuthStore.getState().login("jwt-1", makeUser());
    useAuthStore.getState().setUser(makeUser({ tenant_id: "tenant-2" }));

    expect(useAuthStore.getState().tenantId).toBe("tenant-2");
    expect(localStorage.getItem(TENANT_STORAGE_KEY)).toBe("tenant-2");
  });
});

describe("rehydration", () => {
  it("restores a saved session from the cookie and flags the store as hydrated", async () => {
    useAuthStore.getState().login("jwt-1", makeUser());
    const saved = document.cookie;
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false, isHydrated: false });
    document.cookie = saved;

    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState()).toMatchObject({ token: "jwt-1", isAuthenticated: true, isHydrated: true });
  });
});
