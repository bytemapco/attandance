import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Sidebar from "@/components/navigation/Sidebar";
import { useAuthStore } from "@/store/authStore";
import type { UserProfile } from "@/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/dashboard",
}));

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({ unreadCount: 0, loading: false }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    className?: string;
  }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

describe("Sidebar component", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("renders the institute name when tenant_name is present and removes Campus Platform", () => {
    const mockUser: UserProfile = {
      id: "usr-admin-1",
      email: "aravind.admin.iitb@yopmail.com",
      role: "ADMIN",
      is_active: true,
      tenant_id: "ten-iitb",
      tenant_slug: "iit-bombay",
      tenant_name: "Indian Institute of Technology Bombay",
      student_profile: null,
      teacher_profile: null,
    };
    useAuthStore.getState().login("mock-token", mockUser);

    render(<Sidebar isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("SAHAJ")).toBeInTheDocument();
    expect(screen.getByText("Indian Institute of Technology Bombay")).toBeInTheDocument();
    expect(screen.queryByText("Campus Platform")).not.toBeInTheDocument();
  });

  it("renders fallback for SUPER_ADMIN when tenant_name is missing", () => {
    const mockSuperAdmin: UserProfile = {
      id: "usr-super-1",
      email: "superadmin@sahaj.edu",
      role: "SUPER_ADMIN",
      is_active: true,
      student_profile: null,
      teacher_profile: null,
    };
    useAuthStore.getState().login("mock-token", mockSuperAdmin);

    render(<Sidebar isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Platform Administration")).toBeInTheDocument();
    expect(screen.queryByText("Campus Platform")).not.toBeInTheDocument();
  });

  it("renders fallback Institute for normal role when tenant_name is missing", () => {
    const mockAdminWithoutTenant: UserProfile = {
      id: "usr-admin-2",
      email: "admin@unassigned.edu",
      role: "ADMIN",
      is_active: true,
      student_profile: null,
      teacher_profile: null,
    };
    useAuthStore.getState().login("mock-token", mockAdminWithoutTenant);

    render(<Sidebar isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Institute")).toBeInTheDocument();
    expect(screen.queryByText("Campus Platform")).not.toBeInTheDocument();
  });
});
