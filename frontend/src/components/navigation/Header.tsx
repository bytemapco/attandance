"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, LogOut, Search, Shield } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import CommandPaletteModal from "./CommandPaletteModal";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps): React.JSX.Element {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const homeHref =
    user?.role === "SUPER_ADMIN"
      ? "/super-admin/dashboard"
      : user?.role === "TEACHER"
      ? "/teacher/dashboard"
      : "/admin/dashboard";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleLogout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch {
      // Best-effort logout
    }
    logout();
    toast.success("Signed out successfully");
    router.push("/login");
  }

  const teacherName = user?.teacher_profile
    ? `${user.teacher_profile.first_name} ${user.teacher_profile.last_name}`.trim()
    : null;
  const displayName = teacherName || (user?.email ? user.email.split("@")[0] : "Admin User");
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "SA";
  const displayRole = user?.role === "ADMIN" ? "Administrator" : user?.role === "TEACHER" ? "Faculty Professor" : "User";

  return (
    <>
      <header className="sticky top-0 z-20 h-16 bg-card border-b border-border px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Mobile toggle, Mobile Logo & Global Search */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            type="button"
            onClick={onMenuToggle}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary md:hidden transition-colors shrink-0 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>

          <Link href={homeHref} className="md:hidden flex items-center gap-2 font-bold text-xs text-foreground shrink-0 hover:opacity-80 transition-opacity">
            <img
              src="/sahaj-app-icon.png"
              alt="SAHAJ Logo"
              className="h-7 w-7 rounded-md shadow-2xs object-contain"
            />
            <span className="hidden sm:inline tracking-wider">SAHAJ</span>
          </Link>

          <div
            onClick={() => setIsCommandOpen(true)}
            className="relative w-full max-w-md hidden sm:flex items-center cursor-pointer group"
          >
            <Search size={14} className="absolute left-3 text-muted-foreground group-hover:text-foreground pointer-events-none transition-colors" />
            <input
              type="text"
              readOnly
              placeholder="Search students, classes, sessions, verification logs..."
              className="w-full h-9 pl-9 pr-16 rounded-lg border border-border bg-secondary/40 text-xs text-foreground placeholder:text-muted-foreground group-hover:bg-card group-hover:border-slate-300 cursor-pointer transition-all outline-none"
            />
            <kbd className="absolute right-2.5 px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-mono text-muted-foreground font-semibold shadow-2xs pointer-events-none">
              Ctrl K
            </kbd>
          </div>
        </div>

        {/* Right Tools & Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* User Identity Chip */}
          <div className="flex items-center gap-2.5 pl-1 sm:pl-2 border-border/80">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shadow-xs select-none">
              {initials}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-foreground leading-tight">{displayName}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{displayRole}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <CommandPaletteModal
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </>
  );
}
