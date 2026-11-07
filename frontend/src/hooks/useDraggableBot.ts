import { useCallback, useEffect, useRef, useState } from "react";
import { clampSpot, DEFAULT_SPOT, readSpot, type Spot, writeSpot } from "@/lib/agent/botSpot";

const MOVE_PX = 5; // less than this is a tap, not a drag

interface Press {
  startX: number;
  startY: number;
  origin: Spot;
  moved: boolean;
}

function viewport(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight };
}

/** Lets the bot be dragged anywhere on the screen. A short press still counts as a tap that opens the assistant. */
export function useDraggableBot(onTap: () => void) {
  const [spot, setSpot] = useState<Spot>(DEFAULT_SPOT);
  const latest = useRef<Spot>(DEFAULT_SPOT);
  const press = useRef<Press | null>(null);
  const dragged = useRef(false);

  const place = useCallback((next: Spot): void => {
    latest.current = next;
    setSpot(next);
  }, []);

  useEffect(() => {
    place(clampSpot(readSpot() ?? DEFAULT_SPOT, viewport()));
    const onResize = (): void => place(clampSpot(latest.current, viewport()));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [place]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLElement>): void => {
    press.current = { startX: event.clientX, startY: event.clientY, origin: latest.current, moved: false };
    dragged.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>): void => {
      const current = press.current;
      if (!current) return;
      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;
      if (!current.moved && Math.hypot(dx, dy) < MOVE_PX) return;
      current.moved = true;
      dragged.current = true;
      place(clampSpot({ x: current.origin.x - dx, y: current.origin.y - dy }, viewport()));
    },
    [place],
  );

  const onPointerUp = useCallback((): void => {
    const finished = press.current;
    press.current = null;
    if (finished?.moved) writeSpot(latest.current);
  }, []);

  /** A tap opens the assistant. A drag that ended on the bot does not. */
  const onClick = useCallback((): void => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    onTap();
  }, [onTap]);

  return {
    spot,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onClick },
  };
}
