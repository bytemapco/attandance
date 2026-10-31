import React from "react";
import type { UserProfile } from "@/types";

interface SidebarUserFooterProps {
  user: UserProfile | null;
}

export default function SidebarUserFooter({ user }: SidebarUserFooterProps): React.ReactElement | null {
  if (!user) return null;

  return (
    <div className="p-3 border-t border-[#e3e1dc] bg-card">
      <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-secondary/50 border border-[#e3e1dc]/60">
        <div className="w-8 h-8 rounded-full bg-[#28363b] text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">
          {user.email ? user.email[0].toUpperCase() : "U"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#202b30] truncate" title={user.email || undefined}>
            {user.email || "User"}
          </p>
          <p className="text-[10px] font-medium text-[#526f78] uppercase tracking-wider">{user.role || "Guest"}</p>
        </div>
      </div>
    </div>
  );
}
