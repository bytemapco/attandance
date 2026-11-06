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

  it("shows which tool is running, then clears it when the answer arrives", () => {
    const working = play({ type: "tool", name: "my_schedule", label: "my schedule" });
    expect(working.messages[1].working).toBe("my schedule");
    const answered = chatReducer(working, { type: "event", event: { type: "text", text: "Two classes." } });
    expect(answered.messages[1]).toMatchObject({ text: "Two classes.", working: null });
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

  it("loads a saved conversation and starts a new chat from empty", () => {
    const loaded = chatReducer(emptyChat, {
      type: "load", conversationId: "c9", saved: [{ role: "user", content: "hello", events: [] }, { role: "assistant", content: "hi", events: [] }],
    });
    expect(loaded.conversationId).toBe("c9");
    expect(loaded.messages).toHaveLength(2);
    expect(chatReducer(loaded, { type: "reset" })).toEqual(emptyChat);
  });
});
