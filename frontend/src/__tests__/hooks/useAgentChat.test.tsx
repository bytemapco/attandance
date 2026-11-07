import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAgentChat } from "@/hooks/useAgentChat";
import { rememberConversation, savedConversation } from "@/lib/agent/savedChat";
import { useAuthStore } from "@/store/authStore";
import type { AgentStreamEvent } from "@/types/agent";
import { makeUser } from "../helpers";

const { streamChat, loadConversation } = vi.hoisted(() => ({ streamChat: vi.fn(), loadConversation: vi.fn() }));

vi.mock("@/services/agent", () => ({
  AgentRequestError: class extends Error {
    constructor(
      readonly status: number,
      readonly detail: string,
    ) {
      super(detail);
    }
  },
  streamChat,
  loadConversation,
}));

import { AgentRequestError } from "@/services/agent";

type OnEvent = (event: AgentStreamEvent) => void;

function replyWith(...events: AgentStreamEvent[]): void {
  streamChat.mockImplementation(async (_text: string, _id: string | null, onEvent: OnEvent) => events.forEach(onEvent));
}

/** A stream that stays open until the person stops it. */
function openUntilStopped(...first: AgentStreamEvent[]): void {
  streamChat.mockImplementation(
    (_text: string, _id: string | null, onEvent: OnEvent, signal: AbortSignal) =>
      new Promise<void>((_, reject) => {
        first.forEach(onEvent);
        signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      }),
  );
}

function mount(onNotice = vi.fn()) {
  return { ...renderHook(() => useAgentChat(onNotice)), onNotice };
}

beforeEach(() => {
  streamChat.mockReset();
  loadConversation.mockReset();
  localStorage.clear();
  useAuthStore.setState({ user: makeUser({ id: "u1" }) });
});

describe("sending", () => {
  it("starts empty and idle", () => {
    const { result } = mount();
    expect(result.current.state).toMatchObject({ messages: [], busy: false, conversationId: null });
  });

  it("adds the question and an answer that fills in as events arrive, then goes idle", async () => {
    replyWith({ type: "conversation", id: "c1" }, { type: "tool", name: "my_schedule", label: "my schedule" }, { type: "delta", text: "Two " }, { type: "delta", text: "classes." });
    const { result } = mount();

    await act(() => result.current.send("What is on today?"));

    const [question, answer] = result.current.state.messages;
    expect(question).toMatchObject({ role: "user", text: "What is on today?" });
    expect(answer).toMatchObject({ role: "assistant", text: "Two classes.", steps: ["my schedule"], failed: false });
    expect(result.current.state.busy).toBe(false);
  });

  it("is busy while the answer is coming", async () => {
    openUntilStopped();
    const { result } = mount();

    act(() => void result.current.send("hello"));

    expect(result.current.state.busy).toBe(true);
    act(() => result.current.stop());
    await waitFor(() => expect(result.current.state.busy).toBe(false));
  });

  it("trims the question and ignores an empty one", async () => {
    replyWith({ type: "text", text: "ok" });
    const { result } = mount();

    await act(() => result.current.send("   "));
    expect(streamChat).not.toHaveBeenCalled();

    await act(() => result.current.send("  hi  "));
    expect(streamChat.mock.calls[0][0]).toBe("hi");
  });

  it("continues the same conversation on the next question", async () => {
    replyWith({ type: "conversation", id: "c1" }, { type: "text", text: "ok" });
    const { result } = mount();

    await act(() => result.current.send("one"));
    await act(() => result.current.send("two"));

    expect(streamChat.mock.calls[0][1]).toBeNull();
    expect(streamChat.mock.calls[1][1]).toBe("c1");
    expect(result.current.state.messages).toHaveLength(4);
  });

  it("remembers the conversation so a reload can bring it back", async () => {
    replyWith({ type: "conversation", id: "c7" }, { type: "text", text: "ok" });
    const { result } = mount();

    await act(() => result.current.send("one"));

    expect(savedConversation("u1")).toBe("c7");
  });
});

describe("when something goes wrong", () => {
  it("shows the server's reason when it refuses", async () => {
    streamChat.mockRejectedValue(new AgentRequestError(429, "Too many messages. Wait a minute."));
    const { result, onNotice } = mount();

    await act(() => result.current.send("hello"));

    expect(result.current.state.messages[1]).toMatchObject({ text: "Too many messages. Wait a minute.", failed: true });
    expect(onNotice).not.toHaveBeenCalled();
    expect(result.current.state.busy).toBe(false);
  });

  it("asks the screen to show the data notice when the institution has not accepted it", async () => {
    streamChat.mockRejectedValue(new AgentRequestError(403, "ai_notice_required"));
    const { result, onNotice } = mount();

    await act(() => result.current.send("hello"));

    expect(onNotice).toHaveBeenCalledOnce();
  });

  it("explains a lost connection in plain words", async () => {
    streamChat.mockRejectedValue(new TypeError("Failed to fetch"));
    const { result } = mount();

    await act(() => result.current.send("hello"));

    expect(result.current.state.messages[1]).toMatchObject({ text: expect.stringContaining("could not be reached"), failed: true });
  });

  it("replaces a half-written answer with the error the server sends", async () => {
    replyWith({ type: "delta", text: "Half an ans" }, { type: "error", message: "The assistant is busy right now." });
    const { result } = mount();

    await act(() => result.current.send("hello"));

    expect(result.current.state.messages[1]).toMatchObject({ text: "The assistant is busy right now.", failed: true });
  });

  it("can ask again after a failure", async () => {
    streamChat.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    replyWith({ type: "text", text: "Back." });
    const { result } = mount();

    await act(() => result.current.send("one"));
    streamChat.mockImplementation(async (_t: string, _i: string | null, onEvent: OnEvent) => onEvent({ type: "text", text: "Back." }));
    await act(() => result.current.send("two"));

    expect(result.current.state.messages[3]).toMatchObject({ text: "Back.", failed: false });
  });
});

describe("stopping", () => {
  it("ends the answer and keeps what was written", async () => {
    openUntilStopped({ type: "delta", text: "Partial answer" });
    const { result } = mount();
    act(() => void result.current.send("hello"));

    act(() => result.current.stop());

    await waitFor(() => expect(result.current.state.busy).toBe(false));
    expect(result.current.state.messages[1]).toMatchObject({ text: "Partial answer", failed: false });
  });

  it("says Stopped when nothing had been written", async () => {
    openUntilStopped();
    const { result } = mount();
    act(() => void result.current.send("hello"));

    act(() => result.current.stop());

    await waitFor(() => expect(result.current.state.messages[1]?.text).toBe("Stopped."));
    expect(result.current.state.messages[1].failed).toBe(false);
  });

  it("does nothing when there is nothing to stop", () => {
    const { result } = mount();
    expect(() => act(() => result.current.stop())).not.toThrow();
  });

  it("lets the person ask again right after", async () => {
    openUntilStopped();
    const { result } = mount();
    act(() => void result.current.send("one"));
    act(() => result.current.stop());
    await waitFor(() => expect(result.current.state.busy).toBe(false));

    replyWith({ type: "text", text: "Second." });
    await act(() => result.current.send("two"));

    expect(result.current.state.messages[3].text).toBe("Second.");
  });
});

describe("a new chat", () => {
  it("clears the conversation and forgets the saved one", async () => {
    replyWith({ type: "conversation", id: "c1" }, { type: "text", text: "ok" });
    const { result } = mount();
    await act(() => result.current.send("one"));

    act(() => result.current.reset());

    expect(result.current.state).toMatchObject({ messages: [], conversationId: null, busy: false });
    expect(savedConversation("u1")).toBeNull();
  });

  it("stops an answer that is still coming", async () => {
    openUntilStopped({ type: "delta", text: "Partial" });
    const { result } = mount();
    act(() => void result.current.send("hello"));

    act(() => result.current.reset());

    await waitFor(() => expect(result.current.state.busy).toBe(false));
    expect(result.current.state.messages).toEqual([]);
  });

  it("starts the next question as a new conversation", async () => {
    replyWith({ type: "conversation", id: "c1" }, { type: "text", text: "ok" });
    const { result } = mount();
    await act(() => result.current.send("one"));
    act(() => result.current.reset());

    await act(() => result.current.send("two"));

    expect(streamChat.mock.calls[1][1]).toBeNull();
  });
});

describe("coming back after a reload", () => {
  const saved = [
    { role: "user", content: "who is absent", events: [] },
    { role: "assistant", content: "Two students.", events: [{ type: "ui", kind: "table", title: "Absent", columns: ["Name"], rows: [["Asha"]] }] },
  ];

  it("loads the conversation the person was in", async () => {
    rememberConversation("u1", "c9");
    loadConversation.mockResolvedValue(saved);

    const { result } = mount();

    await waitFor(() => expect(result.current.state.messages).toHaveLength(2));
    expect(loadConversation).toHaveBeenCalledWith("c9");
    expect(result.current.state.conversationId).toBe("c9");
    expect(result.current.state.messages[1]).toMatchObject({ text: "Two students.", blocks: [{ kind: "table" }] });
  });

  it("continues that conversation with the next question", async () => {
    rememberConversation("u1", "c9");
    loadConversation.mockResolvedValue(saved);
    replyWith({ type: "text", text: "ok" });
    const { result } = mount();
    await waitFor(() => expect(result.current.state.messages).toHaveLength(2));

    await act(() => result.current.send("and tomorrow?"));

    expect(streamChat.mock.calls[0][1]).toBe("c9");
  });

  it("does not ask for anything when no conversation was saved", () => {
    mount();
    expect(loadConversation).not.toHaveBeenCalled();
  });

  it("forgets a conversation that can no longer be loaded", async () => {
    rememberConversation("u1", "gone");
    loadConversation.mockRejectedValue(new Error("not found"));

    const { result } = mount();

    await waitFor(() => expect(savedConversation("u1")).toBeNull());
    expect(result.current.state.messages).toEqual([]);
  });

  it("does not load another person's conversation", () => {
    rememberConversation("someone-else", "c9");
    mount();
    expect(loadConversation).not.toHaveBeenCalled();
  });

  it("ignores a conversation that arrives after the window is gone", async () => {
    rememberConversation("u1", "c9");
    let finish: (value: unknown) => void = () => undefined;
    loadConversation.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { result, unmount } = mount();

    unmount();
    await act(async () => finish(saved));

    expect(result.current.state.messages).toEqual([]);
  });
});
