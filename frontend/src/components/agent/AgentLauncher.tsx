"use client";

import React, { useState } from "react";
import AgentBot from "@/components/agent/AgentBot";
import AgentPanel from "@/components/agent/AgentPanel";
import { useDraggableBot } from "@/hooks/useDraggableBot";
import { BOT_SIZE } from "@/lib/agent/botSpot";
import { useAuthStore } from "@/store/authStore";

const ASSISTANT_ROLES = ["ADMIN", "TENANT_ADMIN", "TEACHER"];

/**
 * The floating bot and the window it opens. Minimizing shrinks the window back into the bot; tapping the bot opens
 * it again. The window stays mounted after the first open, so the conversation and any unsent message are kept.
 */
export default function AgentLauncher(): React.ReactElement | null {
  const role = useAuthStore((state) => state.user?.role);
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);

  function show(): void {
    setStarted(true);
    setOpen(true);
  }

  const { spot, handlers } = useDraggableBot(show);
  if (!role || !ASSISTANT_ROLES.includes(role)) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Open the assistant"
        title="SAHAJ Assistant"
        inert={open}
        style={{ right: spot.x, bottom: spot.y, width: BOT_SIZE, height: BOT_SIZE }}
        className={`fixed z-40 touch-none select-none cursor-grab rounded-full shadow-popover transition-[opacity,transform] duration-200 ease-out active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none ${open ? "pointer-events-none scale-75 opacity-0" : "scale-100 opacity-100"}`}
        {...handlers}
      >
        <AgentBot />
      </button>
      {started && <AgentPanel open={open} onMinimize={() => setOpen(false)} />}
    </>
  );
}
