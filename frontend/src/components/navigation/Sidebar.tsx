"use client";

import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
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

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs z-30 md:hidden" onClick={onClose} />
      )}

      <aside className={cn("fixed top-0 bottom-0 left-0 z-40 flex flex-col w-[260px] bg-card border-r border-border transition-transform duration-200", isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0")}>
        <div className="h-16 px-5 border-b border-border flex items-center justify-between">
          <Link href={homeHref} onClick={onClose} className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity cursor-pointer">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">Smart Attendance</h2>
              <p className="text-[11px] text-muted-foreground font-medium">Enterprise System</p>
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
