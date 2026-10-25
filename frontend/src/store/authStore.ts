import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import type { UserProfile } from "@/types";

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
}

interface AuthActions {
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  setUser: (user: UserProfile) => void;
  setTenantId: (tenantId: string | null) => void;
  setHydrated: (state: boolean) => void;
  setSuspended: (suspended: boolean, reason?: string | null) => void;
}

type AuthStore = AuthState & AuthActions;

const cookieStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieVal = parts.pop()?.split(";").shift();
      return cookieVal ? decodeURIComponent(cookieVal) : null;
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=604800; SameSite=Lax${secure}`;
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      tenantId: null,
      isAuthenticated: false,
      isHydrated: false,
      isSuspended: false,
      suspensionReason: null,

      login: (token: string, user: UserProfile): void => {
        const tenantId = user.tenant_id ?? user.tenant_slug ?? null;
        if (typeof window !== "undefined" && tenantId) {
          localStorage.setItem("sas-tenant-id", tenantId);
        }
        set({ token, user, tenantId, isAuthenticated: true, isSuspended: false, suspensionReason: null });
      },

      logout: (): void => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("sas-tenant-id");
        }
        set({ token: null, user: null, tenantId: null, isAuthenticated: false, isSuspended: false, suspensionReason: null });
      },

      setUser: (user: UserProfile): void => {
        const tenantId = user.tenant_id ?? user.tenant_slug ?? null;
        if (typeof window !== "undefined" && tenantId) {
          localStorage.setItem("sas-tenant-id", tenantId);
        }
        set({ user, tenantId });
      },

      setTenantId: (tenantId: string | null): void => {
        set({ tenantId });
      },

      setHydrated: (state: boolean): void => {
        set({ isHydrated: state });
      },

      setSuspended: (suspended: boolean, reason?: string | null): void => {
        set({ isSuspended: suspended, suspensionReason: reason ?? null });
      },
    }),
    {
      name: "sas-auth-storage",
      storage: createJSONStorage(() => cookieStorage),
      onRehydrateStorage: () => {
        return (state): void => {
          state?.setHydrated(true);
        };
      },
    }
  )
);
