import { useEffect, useRef, useState } from "react";

const BASE_CHARS_PER_SECOND = 70;
const CATCH_UP = 4; // each waiting character adds this much speed, so a big piece never trails far behind
const MAX_CHARS_PER_SECOND = 1400;

function prefersLessMotion(): boolean {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

/**
 * Shows `text` as it grows, a few characters per frame, so an answer that arrives in big pieces still reads as it is
 * written. Text that is already complete when the message appears (a saved chat) is shown at once.
 */
export function useTypedText(text: string): string {
  const length = text.length;
  const [count, setCount] = useState(length);
  const shown = useRef(length);
  const target = useRef(length);

  useEffect(() => {
    target.current = length;
    if (prefersLessMotion() || shown.current > length) {
      shown.current = length;
      setCount(length);
      return;
    }
    let frame = 0;
    let before = performance.now();
    const tick = (): void => {
      const now = performance.now();
      const behind = target.current - shown.current;
      const speed = Math.min(MAX_CHARS_PER_SECOND, BASE_CHARS_PER_SECOND + behind * CATCH_UP);
      shown.current = Math.min(target.current, shown.current + (speed * (now - before)) / 1000);
      before = now;
      setCount(Math.floor(shown.current));
      if (shown.current < target.current) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [length]);

  return text.slice(0, Math.min(count, length));
}
