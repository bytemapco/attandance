import React from "react";
import type { UserProfile } from "@/types";

interface SidebarUserFooterProps {
  user: UserProfile | null;
}

export default function SidebarUserFooter({ user }: SidebarUserFooterProps): React.ReactElement | null {
  if (!user) return null;

  return (
    <div className="p-3 border-t border-border bg-card">
      <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-secondary/50 border border-border/60">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs shrink-0 select-none">
          {user.email ? user.email[0].toUpperCase() : "U"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate" title={user.email || undefined}>
            {user.email || "User"}
          </p>
          <p className="text-xs font-medium text-muted-foreground">{user.role || "Guest"}</p>
        </div>
      </div>
    </div>
  );
}
