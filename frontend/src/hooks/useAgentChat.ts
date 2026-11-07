"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { chatReducer, emptyChat, type ChatState } from "@/lib/agent/chatState";
import { rememberConversation, savedConversation } from "@/lib/agent/savedChat";
import { AgentRequestError, loadConversation, streamChat } from "@/services/agent";
import { useAuthStore } from "@/store/authStore";

interface UseAgentChat {
  state: ChatState;
  send: (text: string) => Promise<void>;
  reset: () => void;
  /** Ends the answer that is coming. What was already written stays. */
  stop: () => void;
}

let counter = 0;
const nextId = (): string => `m${(counter += 1)}`;

function messageFor(error: unknown): string {
  if (error instanceof AgentRequestError) return error.detail;
  return "The assistant could not be reached. Check your connection and try again.";
}

export function useAgentChat(onNoticeRequired: () => void): UseAgentChat {
  const [state, dispatch] = useReducer(chatReducer, emptyChat);
  const aborter = useRef<AbortController | null>(null);
  const userId = useAuthStore((auth) => auth.user?.id);
  const { conversationId } = state;

  // After a reload, bring back the conversation the person was in.
  useEffect(() => {
    const saved = userId ? savedConversation(userId) : null;
    if (!userId || !saved) return;
    let current = true;
    loadConversation(saved)
      .then((messages) => current && dispatch({ type: "load", conversationId: saved, saved: messages }))
      .catch(() => rememberConversation(userId, null));
    return () => {
      current = false;
    };
  }, [userId]);

  useEffect(() => {
    if (userId && conversationId) rememberConversation(userId, conversationId);
  }, [userId, conversationId]);

  const send = useCallback(
    async (text: string): Promise<void> => {
      const clean = text.trim();
      if (!clean) return;
      const controller = new AbortController();
      aborter.current = controller;
      dispatch({ type: "send", userId: nextId(), replyId: nextId(), text: clean });
      try {
        await streamChat(clean, conversationId, (event) => dispatch({ type: "event", event }), controller.signal);
      } catch (error) {
        if (controller.signal.aborted) {
          dispatch({ type: "stopped" });
        } else {
          if (error instanceof AgentRequestError && error.detail === "ai_notice_required") onNoticeRequired();
          dispatch({ type: "fail", message: messageFor(error) });
        }
      } finally {
        dispatch({ type: "done" });
      }
    },
    [conversationId, onNoticeRequired],
  );

  const reset = useCallback((): void => {
    aborter.current?.abort();
    if (userId) rememberConversation(userId, null);
    dispatch({ type: "reset" });
  }, [userId]);

  const stop = useCallback((): void => aborter.current?.abort(), []);

  return { state, send, reset, stop };
}
