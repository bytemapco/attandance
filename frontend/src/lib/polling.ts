/**
 * How often the app asks the server again when nothing has pushed an update. SWR pauses all of these while the
 * tab is hidden and refreshes on return. Suspension, forced sign-out and new notifications also arrive instantly
 * over the WebSocket, so these are the fallback, not the main path.
 */
export const HEARTBEAT_MS = 120_000;
export const NOTIFICATIONS_POLL_MS = 120_000;
export const FLAGGED_POLL_MS = 120_000;
export const LIVE_REGISTER_POLL_MS = 5_000;
