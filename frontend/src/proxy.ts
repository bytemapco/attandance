import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "sas-auth-storage";

interface ParsedAuth {
  token: string | null;
  role: string | null;
}

function decodeJwtPayload(token: string): { role?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function parseAuthCookie(request: NextRequest): ParsedAuth {
  const cookie = request.cookies.get(AUTH_COOKIE);
  if (!cookie?.value) return { token: null, role: null };

  const attempts = [
    () => JSON.parse(cookie.value),
    () => JSON.parse(decodeURIComponent(cookie.value)),
  ];

  for (const parseFn of attempts) {
    try {
      const parsed = parseFn();
      if (parsed?.state?.token) {
        const token = parsed.state.token;
        const jwtPayload = decodeJwtPayload(token);
        if (!jwtPayload) return { token: null, role: null };

        // Verify expiration
        if (jwtPayload.exp && jwtPayload.exp * 1000 < Date.now()) {
          return { token: null, role: null };
        }

        return {
          token,
          role: jwtPayload.role || parsed.state.user?.role || null,
        };
      }
    } catch {
      // try next attempt
    }
  }

  return { token: null, role: null };
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const publicPaths = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/onboarding",
    "/suspended",
    "/api",
    "/_next",
    "/favicon.ico",
    "/sahaj-app-icon.png",
    "/sahaj-logo-transparent.png",
    "/sahaj-logo-light.png",
    "/logo.png",
    "/icon-192.png",
    "/icon-512.png",
    "/sw.js",
  ];
  if (
    publicPaths.some((p) => pathname.startsWith(p)) ||
    /\.(png|jpe?g|svg|ico|webp|webmanifest|json)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const { token, role } = parseAuthCookie(request);

  const SUPER_ADMIN_ROLES = ["SUPER_ADMIN"];
  const ADMIN_ROLES = ["ADMIN", "TENANT_ADMIN"];
  const TEACHER_ROLES = ["TEACHER"];

  const isSuperAdmin = role ? SUPER_ADMIN_ROLES.includes(role) : false;
  const isAdmin = role ? ADMIN_ROLES.includes(role) : false;
  const isTeacher = role ? TEACHER_ROLES.includes(role) : false;

  const getDefaultDashboard = (): string => {
    if (isSuperAdmin) return "/super-admin/dashboard";
    if (isAdmin) return "/admin/dashboard";
    if (isTeacher) return "/teacher/classes";
    return "/login";
  };

  if (pathname === "/") {
    if (token && (isSuperAdmin || isAdmin || isTeacher)) {
      return NextResponse.redirect(new URL(getDefaultDashboard(), request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (role === "STUDENT") {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/teacher") ||
      pathname.startsWith("/super-admin")
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/super-admin") && !isSuperAdmin) {
    return NextResponse.redirect(new URL(getDefaultDashboard(), request.url));
  }

  if (pathname.startsWith("/admin") && !isAdmin && !isSuperAdmin) {
    return NextResponse.redirect(new URL(getDefaultDashboard(), request.url));
  }

  if (pathname.startsWith("/teacher") && !isTeacher) {
    return NextResponse.redirect(new URL(getDefaultDashboard(), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
