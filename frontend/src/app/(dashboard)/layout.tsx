"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Sidebar from "@/components/navigation/Sidebar";
import Header from "@/components/navigation/Header";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { usePlatformWebSocket } from "@/hooks/usePlatformWebSocket";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated, user, isSuspended } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isOnboarding = pathname === "/admin/onboarding";

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
      router.replace("/teacher/dashboard");
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
        <PageSkeleton text="Authenticating..." />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col md:flex-row bg-background text-foreground overflow-x-hidden", isOnboarding ? "h-dvh min-h-0 overflow-hidden" : "min-h-screen")}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={cn("flex-1 md:ml-[260px] min-w-0 flex flex-col transition-all duration-200", isOnboarding ? "h-full min-h-0 overflow-hidden" : "min-h-screen")}>
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className={cn("flex-1 max-w-7xl w-full mx-auto min-w-0", isOnboarding ? "min-h-0 overflow-hidden px-3 py-3 sm:px-5" : "px-4 sm:px-6 lg:px-8 py-6")}>
          {children}
        </main>
      </div>
    </div>
  );
}
