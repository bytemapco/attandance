"use client";

import React from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import SidebarUserFooter from "./SidebarUserFooter";
import SuperAdminNavSection from "./SuperAdminNavSection";
import AdminNavSection from "./AdminNavSection";
import TeacherNavSection from "./TeacherNavSection";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps): React.JSX.Element {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const { unreadCount } = useNotifications(25000);

  const homeHref =
    role === "SUPER_ADMIN"
      ? "/super-admin/dashboard"
      : role === "TEACHER"
      ? "/teacher/dashboard"
      : "/admin/dashboard";

  const instituteName =
    user?.tenant_name ||
    (role === "SUPER_ADMIN" ? "Platform Administration" : "Institute");

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-primary/40 z-30 md:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col w-[260px] bg-card border-r border-border shadow-[0_2px_8px_rgba(40,54,59,0.04)] transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="min-h-16 py-3 px-4 sm:px-5 border-b border-border flex items-center justify-between bg-card shrink-0">
          <Link
            href={homeHref}
            onClick={onClose}
            className="flex items-center gap-3 group hover:opacity-95 transition-opacity cursor-pointer min-w-0 w-full"
          >
            <img
              src="/sahaj-app-icon.png"
              alt="SAHAJ Logo"
              className="h-9 w-9 rounded-xl shadow-xs transition-transform object-contain shrink-0 self-center"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-primary tracking-wider leading-tight">SAHAJ</h2>
              <p className="text-[11px] text-muted-foreground font-medium leading-snug break-words">
                {instituteName}
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
          {role === "SUPER_ADMIN" ? (
            <SuperAdminNavSection onClose={onClose} />
          ) : role === "ADMIN" || role === "TENANT_ADMIN" ? (
            <AdminNavSection unreadCount={unreadCount} onClose={onClose} />
          ) : (
            <TeacherNavSection unreadCount={unreadCount} onClose={onClose} />
          )}
        </nav>

        <SidebarUserFooter user={user} />
      </aside>
    </>
  );
}
