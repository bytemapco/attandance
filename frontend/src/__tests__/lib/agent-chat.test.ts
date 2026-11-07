import { describe, expect, it } from "vitest";
import { chatReducer, emptyChat, type ChatState } from "@/lib/agent/chatState";
import { readEvents } from "@/lib/agent/ndjson";
import type { AgentStreamEvent } from "@/types/agent";

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<unknown[]> {
  const found: unknown[] = [];
  for await (const event of readEvents<unknown>(stream)) found.push(event);
  return found;
}

describe("readEvents", () => {
  it("yields each line as soon as it is complete", async () => {
    expect(await collect(streamOf('{"a":1}\n{"b":2}\n'))).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("joins a line that arrives in pieces, even inside a multi-byte character", async () => {
    const whole = new TextEncoder().encode('{"t":"नमस्ते"}\n');
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(whole.slice(0, 9));
        controller.enqueue(whole.slice(9));
        controller.close();
      },
    });
    expect(await collect(stream)).toEqual([{ t: "नमस्ते" }]);
  });

  it("reads a last line that has no newline and skips blank lines", async () => {
    expect(await collect(streamOf('{"a":1}\n\n', '{"b":2}'))).toEqual([{ a: 1 }, { b: 2 }]);
  });
});

function play(...events: AgentStreamEvent[]): ChatState {
  const sent = chatReducer(emptyChat, { type: "send", userId: "u1", replyId: "r1", text: "hi" });
  return events.reduce((state, event) => chatReducer(state, { type: "event", event }), sent);
}

describe("chatReducer", () => {
  it("adds the person's message and an empty reply, and marks the chat busy", () => {
    const state = chatReducer(emptyChat, { type: "send", userId: "u1", replyId: "r1", text: "hi" });
    expect(state.busy).toBe(true);
    expect(state.messages.map((m) => [m.role, m.text])).toEqual([["user", "hi"], ["assistant", ""]]);
  });

  it("remembers the conversation so the next message continues it", () => {
    expect(play({ type: "conversation", id: "c1" }).conversationId).toBe("c1");
  });

  it("lists what was looked up, in order", () => {
    const state = play({ type: "tool", name: "my_schedule", label: "my schedule" }, { type: "tool", name: "x", label: "class register" });
    expect(state.messages[1].steps).toEqual(["my schedule", "class register"]);
  });

  it("builds the answer from pieces as they arrive, then keeps the whole answer when it closes", () => {
    const streaming = play({ type: "delta", text: "You have " }, { type: "delta", text: "two classes." });
    expect(streaming.messages[1].text).toBe("You have two classes.");

    const closed = chatReducer(streaming, { type: "event", event: { type: "text", text: "You have two classes." } });
    expect(closed.messages[1].text).toBe("You have two classes.");
  });

  it("replaces a half-written answer with the error when the stream breaks", () => {
    const state = play({ type: "delta", text: "You ha" }, { type: "error", message: "Unavailable" });
    expect(state.messages[1]).toMatchObject({ text: "Unavailable", failed: true });
  });

  it("ends busy when the stream ends", () => {
    expect(chatReducer(play(), { type: "done" }).busy).toBe(false);
  });

  it("attaches tables and proposal cards to the reply in order", () => {
    const state = play(
      { type: "ui", kind: "table", title: "Absent", columns: ["Name"], rows: [["Asha"]] },
      { type: "proposal", id: "p1", tool: "send_message", summary: "Send", details: {}, editable: {}, expires_at: "2026-11-06T10:00:00Z" },
    );
    expect(state.messages[1].blocks.map((b) => b.type)).toEqual(["ui", "proposal"]);
  });

  it("shows a failure in red and ends busy", () => {
    const state = chatReducer(
      chatReducer(play(), { type: "event", event: { type: "error", message: "Unavailable" } }),
      { type: "done" },
    );
    expect(state.messages[1]).toMatchObject({ text: "Unavailable", failed: true });
    expect(state.busy).toBe(false);
  });

  it("keeps what was written when stopped, and says Stopped only when nothing was", () => {
    const written = chatReducer(play({ type: "delta", text: "Partial" }), { type: "stopped" });
    expect(written.messages[1]).toMatchObject({ text: "Partial", failed: false });

    const silent = chatReducer(play(), { type: "stopped" });
    expect(silent.messages[1]).toMatchObject({ text: "Stopped.", failed: false });
  });

  it("does not add Stopped. to a reply that already has a table or card", () => {
    const state = chatReducer(play({ type: "ui", kind: "table", title: "T", columns: [], rows: [] }), { type: "stopped" });
    expect(state.messages[1].text).toBe("");
  });

  it("does nothing for events that arrive when there is no reply to put them in", () => {
    expect(chatReducer(emptyChat, { type: "event", event: { type: "delta", text: "x" } })).toBe(emptyChat);
    expect(chatReducer(emptyChat, { type: "stopped" })).toBe(emptyChat);
    expect(chatReducer(emptyChat, { type: "fail", message: "x" })).toEqual(emptyChat);
  });

  it("only ever changes the newest reply, never an earlier one", () => {
    const first = chatReducer(play({ type: "delta", text: "First." }), { type: "done" });
    const second = chatReducer(first, { type: "send", userId: "u2", replyId: "r2", text: "again" });
    const answered = chatReducer(second, { type: "event", event: { type: "delta", text: "Second." } });
    expect(answered.messages.map((m) => m.text)).toEqual(["hi", "First.", "again", "Second."]);
  });

  it("keeps the order of text pieces exactly as they arrive", () => {
    const state = play(...["Hel", "lo ", "wor", "ld"].map((text) => ({ type: "delta" as const, text })));
    expect(state.messages[1].text).toBe("Hello world");
  });

  it("gives each loaded message the saved text and cards, and marks none as failed or working", () => {
    const table = { type: "ui" as const, kind: "table" as const, title: "T", columns: ["A"], rows: [["x"]] };
    const loaded = chatReducer(emptyChat, { type: "load", conversationId: "c9", saved: [{ role: "assistant", content: "Here.", events: [table] }] });
    expect(loaded.messages[0]).toMatchObject({ role: "assistant", text: "Here.", blocks: [table], steps: [], failed: false });
    expect(loaded.busy).toBe(false);
  });

  it("loads messages with ids that do not clash", () => {
    const loaded = chatReducer(emptyChat, {
      type: "load", conversationId: "c9", saved: [{ role: "user", content: "a", events: [] }, { role: "assistant", content: "b", events: [] }],
    });
    expect(new Set(loaded.messages.map((m) => m.id)).size).toBe(2);
  });

  it("loads a saved conversation and starts a new chat from empty", () => {
    const loaded = chatReducer(emptyChat, {
      type: "load", conversationId: "c9", saved: [{ role: "user", content: "hello", events: [] }, { role: "assistant", content: "hi", events: [] }],
    });
    expect(loaded.conversationId).toBe("c9");
    expect(loaded.messages).toHaveLength(2);
    expect(chatReducer(loaded, { type: "reset" })).toEqual(emptyChat);
  });
});
