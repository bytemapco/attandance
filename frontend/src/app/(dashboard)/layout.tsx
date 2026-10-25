"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Sidebar from "@/components/navigation/Sidebar";
import Header from "@/components/navigation/Header";
import GlassLoader from "@/components/ui/GlassLoader";
import { usePlatformWebSocket } from "@/hooks/usePlatformWebSocket";

export default function DashboardLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, user, isSuspended } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Connect WebSocket — handles real-time tenant suspension push
  usePlatformWebSocket();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const isSuperAdminRole = user?.role === "SUPER_ADMIN";
    const isAdminRole = user?.role === "ADMIN" || user?.role === "TENANT_ADMIN";
    const isTeacherRole = user?.role === "TEACHER";

    if (isSuspended && !isSuperAdminRole) {
      router.replace("/suspended");
      return;
    }

    if (user?.role === "STUDENT") {
      router.replace("/login");
      return;
    }

    if (isTeacherRole && (pathname.startsWith("/admin") || pathname.startsWith("/super-admin"))) {
      router.replace("/teacher/classes");
      return;
    }
    if (isAdminRole && (pathname.startsWith("/teacher") || pathname.startsWith("/super-admin"))) {
      router.replace("/admin/dashboard");
      return;
    }
    if (isSuperAdminRole && pathname.startsWith("/teacher")) {
      router.replace("/super-admin/dashboard");
      return;
    }
  }, [isHydrated, isAuthenticated, isSuspended, user, pathname, router]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <GlassLoader text="Authenticating..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 md:ml-[260px] min-w-0 flex flex-col transition-all duration-200 min-h-screen">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
