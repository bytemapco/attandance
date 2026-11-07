import React from "react";
import { cn } from "@/lib/utils";

interface AgentBotProps {
  /** Pixels on each side. The face is drawn on a 56 grid, so it scales cleanly. */
  size?: number;
  className?: string;
}

/** The assistant's face: a round bot that blinks, with a light antenna. Drawn in code, so it is always crisp and needs no download. */
export default function AgentBot({ size = 56, className }: AgentBotProps): React.ReactElement {
  return (
    <svg viewBox="0 0 56 56" width={size} height={size} aria-hidden className={cn("agent-bot", className)}>
      <circle cx="28" cy="28" r="28" className="fill-primary" />
      <line x1="28" y1="12" x2="28" y2="7" className="stroke-primary-foreground/70" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="6" r="2.4" className="agent-antenna fill-accent" />
      <rect x="14" y="16" width="28" height="22" rx="8" className="fill-primary-foreground" />
      <circle cx="22" cy="26" r="3" className="agent-eye fill-primary" />
      <circle cx="34" cy="26" r="3" className="agent-eye fill-primary" />
      <rect x="23" y="32" width="10" height="2.5" rx="1.25" className="fill-primary/60" />
    </svg>
  );
}
