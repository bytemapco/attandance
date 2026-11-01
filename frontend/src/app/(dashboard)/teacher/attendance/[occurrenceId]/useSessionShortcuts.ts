"use client";

import { useEffect, useRef } from "react";
import { isTypingTarget } from "./registerStatus";

interface SessionShortcuts {
  enabled: boolean;
  onSave: () => void;
  onStop: () => void;
  onMarkRemaining: () => void;
  onToggleFullscreen: () => void;
  onEscape: () => void;
}

export function useSessionShortcuts(props: SessionShortcuts): void {
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const p = latest.current;
      if (!p.enabled) return;
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === "s") {
        e.preventDefault();
        return p.onSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        return p.onStop();
      }
      if (key === "escape") return p.onEscape();
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
      if (key === "p" && e.shiftKey) {
        e.preventDefault();
        return p.onMarkRemaining();
      }
      if (key === "f" && !e.shiftKey) {
        e.preventDefault();
        p.onToggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
