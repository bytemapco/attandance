// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";
import { AUTH_STORAGE_KEY } from "@/lib/config";
import { SECONDS_FROM_NOW, makeJwt } from "./helpers";

function request(path: string, cookieValue?: string): NextRequest {
  const headers: Record<string, string> = cookieValue === undefined ? {} : { cookie: `${AUTH_STORAGE_KEY}=${cookieValue}` };
  return new NextRequest(new URL(path, "http://app.test"), { headers });
}

function sessionCookie(role: string, expiresInSeconds = 3600): string {
  const token = makeJwt({ role, exp: SECONDS_FROM_NOW(expiresInSeconds) });
  return encodeURIComponent(JSON.stringify({ state: { token, user: { role } } }));
}

function outcome(path: string, cookie?: string): string {
  const response = proxy(request(path, cookie));
  const location = response.headers.get("location");
  return location ? new URL(location).pathname : "next";
}

describe("public paths", () => {
  it.each(["/login", "/forgot-password", "/reset-password", "/onboarding", "/suspended", "/api/health", "/logo.png"])(
    "lets a signed-out visitor reach %s",
    (path) => {
      expect(outcome(path)).toBe("next");
    },
  );

  it("lets image and manifest files through", () => {
    expect(outcome("/images/hero.webp")).toBe("next");
    expect(outcome("/site.webmanifest")).toBe("next");
  });
});

describe("signed out", () => {
  it.each(["/", "/admin/dashboard", "/teacher/today", "/super-admin/tenants"])("sends %s to /login", (path) => {
    expect(outcome(path)).toBe("/login");
  });

  it("treats a broken cookie as signed out", () => {
    expect(outcome("/admin/dashboard", "not-json")).toBe("/login");
    expect(outcome("/admin/dashboard", encodeURIComponent(JSON.stringify({ state: { token: "abc" } })))).toBe("/login");
  });

  it("treats an expired token as signed out", () => {
    expect(outcome("/admin/dashboard", sessionCookie("ADMIN", -60))).toBe("/login");
  });
});

describe("the home page", () => {
  it.each([
    ["SUPER_ADMIN", "/super-admin/dashboard"],
    ["ADMIN", "/admin/dashboard"],
    ["TENANT_ADMIN", "/admin/dashboard"],
    ["TEACHER", "/teacher/dashboard"],
  ])("sends a %s to their dashboard", (role, expected) => {
    expect(outcome("/", sessionCookie(role))).toBe(expected);
  });

  it("sends a student to /login, because students use the mobile app", () => {
    expect(outcome("/", sessionCookie("STUDENT"))).toBe("/login");
  });
});

describe("role boundaries", () => {
  it.each([
    ["ADMIN", "/admin/class-management", "next"],
    ["TENANT_ADMIN", "/admin/users/students", "next"],
    ["SUPER_ADMIN", "/admin/dashboard", "next"],
    ["SUPER_ADMIN", "/super-admin/tenants", "next"],
    ["TEACHER", "/teacher/attendance/occ-1", "next"],
    ["ADMIN", "/super-admin/tenants", "/admin/dashboard"],
    ["TEACHER", "/super-admin/tenants", "/teacher/dashboard"],
    ["TEACHER", "/admin/dashboard", "/teacher/dashboard"],
    ["ADMIN", "/teacher/today", "/admin/dashboard"],
    ["SUPER_ADMIN", "/teacher/today", "/super-admin/dashboard"],
  ])("%s opening %s gets %s", (role, path, expected) => {
    expect(outcome(path, sessionCookie(role))).toBe(expected);
  });

  it.each(["/admin/dashboard", "/teacher/dashboard", "/super-admin/dashboard"])(
    "keeps a student out of %s",
    (path) => {
      expect(outcome(path, sessionCookie("STUDENT"))).toBe("/login");
    },
  );

  it("reads the cookie whether or not it is URL-encoded", () => {
    const raw = decodeURIComponent(sessionCookie("TEACHER"));
    expect(outcome("/teacher/today", raw)).toBe("next");
  });

  it("takes the role from the token, not from the stored user", () => {
    const token = makeJwt({ role: "TEACHER", exp: SECONDS_FROM_NOW(3600) });
    const cookie = encodeURIComponent(JSON.stringify({ state: { token, user: { role: "SUPER_ADMIN" } } }));
    expect(outcome("/super-admin/tenants", cookie)).toBe("/teacher/dashboard");
  });
});
