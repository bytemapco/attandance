import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Sidebar from "@/components/navigation/Sidebar";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";
import { makeUser } from "../helpers";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/hooks/useNotifications", () => ({ useNotifications: () => ({ unreadCount: 0 }) }));

function signInAs(role: UserRole, tenantName?: string): void {
  useAuthStore.getState().login("jwt", makeUser({ role, tenant_name: tenantName ?? null }));
}

function renderSidebar(isOpen = true) {
  const onClose = vi.fn();
  render(<Sidebar isOpen={isOpen} onClose={onClose} />);
  return { onClose };
}

function homeHref(): string | null {
  return screen.getByRole("link", { name: /SAHAJ/ }).getAttribute("href");
}

beforeEach(() => {
  useAuthStore.getState().logout();
});

describe("Sidebar home link", () => {
  it.each([
    ["SUPER_ADMIN", "/super-admin/dashboard"],
    ["TEACHER", "/teacher/dashboard"],
    ["ADMIN", "/admin/dashboard"],
    ["TENANT_ADMIN", "/admin/dashboard"],
  ] as const)("takes a %s to %s", (role, href) => {
    signInAs(role);
    renderSidebar();
    expect(homeHref()).toBe(href);
  });
});

describe("Sidebar institute name", () => {
  it("shows the institution's own name", () => {
    signInAs("ADMIN", "Gyan Polytechnic");
    renderSidebar();
    expect(screen.getByText("Gyan Polytechnic")).toBeInTheDocument();
  });

  it("calls the platform owner's workspace Platform Administration", () => {
    signInAs("SUPER_ADMIN");
    renderSidebar();
    expect(screen.getByText("Platform Administration")).toBeInTheDocument();
  });

  it("falls back to a neutral name for everyone else", () => {
    signInAs("TEACHER");
    renderSidebar();
    expect(screen.getByText("Institute")).toBeInTheDocument();
  });
});

describe("Sidebar navigation by role", () => {
  function navLinks(): string[] {
    return screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "")
      .filter(Boolean);
  }

  it("shows a teacher teacher pages only", () => {
    signInAs("TEACHER");
    renderSidebar();
    const links = navLinks();

    expect(links.some((href) => href.startsWith("/teacher"))).toBe(true);
    expect(links.some((href) => href.startsWith("/admin") || href.startsWith("/super-admin"))).toBe(false);
  });

  it("shows an admin admin pages only", () => {
    signInAs("ADMIN");
    renderSidebar();
    const links = navLinks();

    expect(links.some((href) => href.startsWith("/admin"))).toBe(true);
    expect(links.some((href) => href.startsWith("/teacher") || href.startsWith("/super-admin"))).toBe(false);
  });

  it("shows the platform owner platform pages only", () => {
    signInAs("SUPER_ADMIN");
    renderSidebar();
    const links = navLinks();

    expect(links.some((href) => href.startsWith("/super-admin"))).toBe(true);
    expect(links.some((href) => href.startsWith("/teacher") || href.startsWith("/admin"))).toBe(false);
  });
});

describe("Sidebar on small screens", () => {
  it("shows a dismissable backdrop only while open", () => {
    signInAs("TEACHER");
    const { container } = render(<Sidebar isOpen onClose={vi.fn()} />);
    expect(container.querySelector("[aria-hidden]")).not.toBeNull();
  });
});
