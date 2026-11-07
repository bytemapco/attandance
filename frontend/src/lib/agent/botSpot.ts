/** Where the assistant's bot sits, as distances from the right and bottom edges, so it stays put when the window resizes. */
export interface Spot {
  x: number;
  y: number;
}

export const BOT_SIZE = 56;
export const BOT_EDGE = 16;
const KEY = "sahaj-assistant-bot-spot";
export const DEFAULT_SPOT: Spot = { x: BOT_EDGE, y: BOT_EDGE };

/** Keeps the bot fully inside the screen, however it was left or the window was resized. */
export function clampSpot(spot: Spot, viewport: { width: number; height: number }): Spot {
  const maxX = Math.max(BOT_EDGE, viewport.width - BOT_SIZE - BOT_EDGE);
  const maxY = Math.max(BOT_EDGE, viewport.height - BOT_SIZE - BOT_EDGE);
  return {
    x: Math.min(maxX, Math.max(BOT_EDGE, Math.round(spot.x))),
    y: Math.min(maxY, Math.max(BOT_EDGE, Math.round(spot.y))),
  };
}

function isSpot(value: unknown): value is Spot {
  if (typeof value !== "object" || value === null) return false;
  const { x, y } = value as Record<string, unknown>;
  return typeof x === "number" && Number.isFinite(x) && typeof y === "number" && Number.isFinite(y);
}

export function readSpot(): Spot | null {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return isSpot(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function writeSpot(spot: Spot): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(spot));
  } catch {
    // Storage can be blocked. The bot still moves; it just starts in the corner next time.
  }
}
