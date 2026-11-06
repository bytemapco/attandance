import type { AgentStreamEvent, ChatMessage, SavedMessage } from "@/types/agent";

export interface ChatState {
  conversationId: string | null;
  messages: ChatMessage[];
  busy: boolean;
}

export type ChatAction =
  | { type: "send"; userId: string; replyId: string; text: string }
  | { type: "event"; event: AgentStreamEvent }
  | { type: "fail"; message: string }
  | { type: "done" }
  | { type: "load"; conversationId: string; saved: SavedMessage[] }
  | { type: "reset" };

export const emptyChat: ChatState = { conversationId: null, messages: [], busy: false };

function blank(id: string, role: ChatMessage["role"], text = ""): ChatMessage {
  return { id, role, text, blocks: [], working: null, failed: false };
}

function updateReply(state: ChatState, change: (reply: ChatMessage) => ChatMessage): ChatState {
  const last = state.messages[state.messages.length - 1];
  if (!last || last.role !== "assistant") return state;
  return { ...state, messages: [...state.messages.slice(0, -1), change(last)] };
}

function applyEvent(state: ChatState, event: AgentStreamEvent): ChatState {
  switch (event.type) {
    case "conversation":
      return { ...state, conversationId: event.id };
    case "tool":
      return updateReply(state, (reply) => ({ ...reply, working: event.label }));
    case "text":
      return updateReply(state, (reply) => ({ ...reply, text: event.text, working: null }));
    case "error":
      return updateReply(state, (reply) => ({ ...reply, text: event.message, working: null, failed: true }));
    default:
      return updateReply(state, (reply) => ({ ...reply, blocks: [...reply.blocks, event], working: null }));
  }
}

function fromSaved(saved: SavedMessage[]): ChatMessage[] {
  return saved.map((message, index) => ({
    ...blank(`saved-${index}`, message.role, message.content),
    blocks: message.events,
  }));
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "send":
      return {
        ...state,
        busy: true,
        messages: [...state.messages, blank(action.userId, "user", action.text), blank(action.replyId, "assistant")],
      };
    case "event":
      return applyEvent(state, action.event);
    case "fail":
      return updateReply(state, (reply) => ({ ...reply, text: action.message, working: null, failed: true }));
    case "done":
      return updateReply({ ...state, busy: false }, (reply) => ({ ...reply, working: null }));
    case "load":
      return { conversationId: action.conversationId, messages: fromSaved(action.saved), busy: false };
    case "reset":
      return emptyChat;
  }
}
