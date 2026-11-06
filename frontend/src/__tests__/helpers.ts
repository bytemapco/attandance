import { vi } from "vitest";
import type { UserProfile } from "@/types";

export function makeUser(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "user-1",
    email: "teacher@college.in",
    role: "TEACHER",
    is_active: true,
    tenant_id: "tenant-1",
    tenant_slug: "college",
    student_profile: null,
    teacher_profile: null,
    ...overrides,
  };
}

function base64Url(value: object): string {
  return btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** An unsigned token with the given payload. The front end only reads the payload, never verifies it. */
export function makeJwt(payload: { role?: string; exp?: number }): string {
  return `${base64Url({ alg: "HS256", typ: "JWT" })}.${base64Url(payload)}.signature`;
}

/**
 * Replaces `window.location` for the code under test. jsdom cannot navigate, and assigning to the real
 * `location` would trigger its setter, so the stand-in is defined as an own property.
 */
export function stubWindowLocation<T extends object>(location: T): T {
  const fakeWindow = Object.create(window);
  Object.defineProperty(fakeWindow, "location", { value: location, configurable: true });
  vi.stubGlobal("window", fakeWindow);
  return location;
}

export const SECONDS_FROM_NOW = (seconds: number): number => Math.floor(Date.now() / 1000) + seconds;
