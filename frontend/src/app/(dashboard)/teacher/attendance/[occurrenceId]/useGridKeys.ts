"use client";

import { useEffect, useRef } from "react";
import { isTypingTarget, type DisplayStatus, type MarkStatus } from "./registerStatus";

interface GridKeys {
  enabled: boolean;
  canMark: boolean;
  ids: string[];
  activeId: string | null;
  statusOf: (id: string) => DisplayStatus;
  columns: () => number;
  onActive: (id: string) => void;
  onMark: (id: string, status: MarkStatus | null) => void;
  onFilter: (index: number) => void;
  onSearch: () => void;
}

/** P/A mark and advance, Space toggles, U undoes, arrows move, / searches, 1-6 pick a filter. */
export function useGridKeys(props: GridKeys): void {
  const latest = useRef(props);
  useEffect(() => {
    latest.current = props;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      const p = latest.current;
      if (!p.enabled || e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
      const index = p.activeId ? p.ids.indexOf(p.activeId) : -1;
      const go = (to: number): void => {
        if (p.ids.length === 0) return;
        p.onActive(p.ids[Math.min(Math.max(to, 0), p.ids.length - 1)]);
        e.preventDefault();
      };
      const mark = (status: MarkStatus | null, advance: boolean): void => {
        if (!p.canMark || !p.activeId) return;
        p.onMark(p.activeId, status);
        if (advance && index + 1 < p.ids.length) p.onActive(p.ids[index + 1]);
        e.preventDefault();
      };
      const onButton = e.target instanceof HTMLElement && ["BUTTON", "A"].includes(e.target.tagName);
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (key === "ArrowRight") return go(index + 1);
      if (key === "ArrowLeft") return go(index - 1);
      if (key === "ArrowDown") return go(index + p.columns());
      if (key === "ArrowUp") return go(index - p.columns());
      if (key === "Home") return go(0);
      if (key === "End") return go(p.ids.length - 1);
      if (key === "p" && !e.shiftKey) return mark("PRESENT", true);
      if (key === "a") return mark("ABSENT", true);
      if (key === "u" || key === "Backspace") return mark(null, false);
      if (key === " " && !onButton && p.activeId) return mark(p.statusOf(p.activeId) === "PRESENT" ? "ABSENT" : "PRESENT", false);
      if (key === "/") {
        e.preventDefault();
        return p.onSearch();
      }
      if (/^[1-6]$/.test(key)) p.onFilter(Number(key) - 1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
