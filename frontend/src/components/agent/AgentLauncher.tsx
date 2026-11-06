"use client";

import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import AgentPanel from "@/components/agent/AgentPanel";
import { useAuthStore } from "@/store/authStore";

const ASSISTANT_ROLES = ["ADMIN", "TENANT_ADMIN", "TEACHER"];

/** The assistant button, shown only to teachers and institution admins. */
export default function AgentLauncher(): React.ReactElement | null {
  const role = useAuthStore((state) => state.user?.role);
  const [open, setOpen] = useState(false);
  if (!role || !ASSISTANT_ROLES.includes(role)) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open the assistant"
          className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <MessageSquare size={20} aria-hidden />
        </button>
      )}
      {open && <AgentPanel onClose={() => setOpen(false)} />}
    </>
  );
}
