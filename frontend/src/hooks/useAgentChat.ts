"use client";

import { useCallback, useReducer, useRef } from "react";
import { chatReducer, emptyChat, type ChatState } from "@/lib/agent/chatState";
import { AgentRequestError, streamChat } from "@/services/agent";

interface UseAgentChat {
  state: ChatState;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

let counter = 0;
const nextId = (): string => `m${(counter += 1)}`;

function messageFor(error: unknown): string {
  if (error instanceof AgentRequestError) return error.detail;
  if (error instanceof DOMException && error.name === "AbortError") return "Stopped.";
  return "The assistant could not be reached. Check your connection and try again.";
}

export function useAgentChat(onNoticeRequired: () => void): UseAgentChat {
  const [state, dispatch] = useReducer(chatReducer, emptyChat);
  const aborter = useRef<AbortController | null>(null);
  const { conversationId } = state;

  const send = useCallback(
    async (text: string): Promise<void> => {
      const clean = text.trim();
      if (!clean) return;
      aborter.current = new AbortController();
      dispatch({ type: "send", userId: nextId(), replyId: nextId(), text: clean });
      try {
        await streamChat(clean, conversationId, (event) => dispatch({ type: "event", event }), aborter.current.signal);
      } catch (error) {
        if (error instanceof AgentRequestError && error.detail === "ai_notice_required") onNoticeRequired();
        dispatch({ type: "fail", message: messageFor(error) });
      } finally {
        dispatch({ type: "done" });
      }
    },
    [conversationId, onNoticeRequired],
  );

  const reset = useCallback((): void => {
    aborter.current?.abort();
    dispatch({ type: "reset" });
  }, []);

  return { state, send, reset };
}
