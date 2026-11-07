/** Remembers which conversation a person was in, so a page reload brings it back from the server. */
const key = (userId: string): string => `sahaj-assistant-chat:${userId}`;

export function savedConversation(userId: string): string | null {
  try {
    return localStorage.getItem(key(userId));
  } catch {
    return null;
  }
}

export function rememberConversation(userId: string, conversationId: string | null): void {
  try {
    if (conversationId) localStorage.setItem(key(userId), conversationId);
    else localStorage.removeItem(key(userId));
  } catch {
    // Storage can be blocked. The chat still works; it just is not restored after a reload.
  }
}
