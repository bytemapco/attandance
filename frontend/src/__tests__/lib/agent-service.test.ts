import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentStreamEvent } from "@/types/agent";

const { post, get } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));

vi.mock("@/lib/api", () => ({ default: { post, get } }));
vi.mock("@/lib/api/client", () => ({ sessionHeaders: () => ({ Authorization: "Bearer token", "X-Tenant-ID": "t1" }) }));
vi.mock("@/lib/config", () => ({ getApiBaseUrl: () => "http://api.test/api/v1" }));

import {
  acceptNotice,
  AgentRequestError,
  cancelProposal,
  confirmProposal,
  downloadLinked,
  loadConversation,
  streamChat,
} from "@/services/agent";

const fetchMock = vi.fn();

function ndjson(...lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      lines.forEach((line) => controller.enqueue(encoder.encode(line)));
      controller.close();
    },
  });
}

function respond(init: { ok?: boolean; status?: number; body?: ReadableStream<Uint8Array> | null; json?: unknown }): void {
  fetchMock.mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    body: init.body === undefined ? null : init.body,
    json: async () => {
      if (init.json === undefined) throw new Error("not json");
      return init.json;
    },
  });
}

beforeEach(() => {
  [post, get, fetchMock].forEach((mock) => mock.mockReset());
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("streamChat", () => {
  it("posts the message to the chat endpoint with the signed-in session", async () => {
    respond({ body: ndjson("") });
    const signal = new AbortController().signal;

    await streamChat("hello", "c1", () => undefined, signal);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/v1/agent/chat");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json", Authorization: "Bearer token", "X-Tenant-ID": "t1" });
    expect(JSON.parse(init.body)).toEqual({ message: "hello", conversation_id: "c1" });
    expect(init.signal).toBe(signal);
  });

  it("starts a new conversation when it has no id", async () => {
    respond({ body: ndjson("") });
    await streamChat("hello", null, () => undefined);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).conversation_id).toBeNull();
  });

  it("hands every event to the caller in the order sent, even when a line is split", async () => {
    respond({ body: ndjson('{"type":"conversation","id":"c1"}\n{"type":"del', 'ta","text":"Hi"}\n{"type":"text","text":"Hi"}\n') });
    const seen: AgentStreamEvent[] = [];

    await streamChat("hello", null, (event) => seen.push(event));

    expect(seen).toEqual([{ type: "conversation", id: "c1" }, { type: "delta", text: "Hi" }, { type: "text", text: "Hi" }]);
  });

  it("refuses with the server's own message and status", async () => {
    respond({ ok: false, status: 429, json: { detail: "Too many messages. Wait a minute." } });
    const error = await streamChat("hello", null, () => undefined).catch((caught) => caught);
    expect(error).toBeInstanceOf(AgentRequestError);
    expect(error).toMatchObject({ status: 429, detail: "Too many messages. Wait a minute." });
  });

  it("carries the notice-required code so the screen can ask for acceptance", async () => {
    respond({ ok: false, status: 403, json: { detail: "ai_notice_required" } });
    const error = await streamChat("hello", null, () => undefined).catch((caught) => caught);
    expect(error.detail).toBe("ai_notice_required");
  });

  it("uses a plain message when the refusal is not JSON", async () => {
    respond({ ok: false, status: 502 });
    const error = await streamChat("hello", null, () => undefined).catch((caught) => caught);
    expect(error).toMatchObject({ status: 502, detail: "The assistant could not answer." });
  });

  it("fails when the answer has no body to read", async () => {
    respond({ body: null });
    await expect(streamChat("hello", null, () => undefined)).rejects.toBeInstanceOf(AgentRequestError);
  });

  it("does not catch a network failure, so the screen can show it", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(streamChat("hello", null, () => undefined)).rejects.toThrow("Failed to fetch");
  });
});

describe("the other assistant calls", () => {
  it("accepts the data notice", async () => {
    post.mockResolvedValue({ data: { notice_accepted: true } });
    expect(await acceptNotice()).toEqual({ notice_accepted: true });
    expect(post).toHaveBeenCalledWith("/agent/notice/accept");
  });

  it("loads a saved conversation by id", async () => {
    get.mockResolvedValue({ data: [{ role: "user", content: "hi", events: [] }] });
    expect(await loadConversation("c9")).toEqual([{ role: "user", content: "hi", events: [] }]);
    expect(get).toHaveBeenCalledWith("/agent/conversations/c9");
  });

  it("confirms a prepared change with the edited fields", async () => {
    post.mockResolvedValue({ data: { status: "confirmed", message: "Sent" } });
    expect(await confirmProposal("p1", { title: "Reminder" })).toEqual({ status: "confirmed", message: "Sent" });
    expect(post).toHaveBeenCalledWith("/agent/proposals/p1/confirm", { edits: { title: "Reminder" } });
  });

  it("cancels a prepared change", async () => {
    post.mockResolvedValue({ data: {} });
    await cancelProposal("p1");
    expect(post).toHaveBeenCalledWith("/agent/proposals/p1/cancel");
  });
});

describe("downloadLinked", () => {
  const created = vi.fn(() => "blob:report");
  const revoked = vi.fn();

  const links: HTMLAnchorElement[] = [];

  beforeEach(() => {
    links.length = 0;
    const real = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const element = real(tag);
      if (tag === "a") {
        vi.spyOn(element as HTMLAnchorElement, "click").mockImplementation(() => undefined);
        links.push(element as HTMLAnchorElement);
      }
      return element;
    });
    Object.assign(URL, { createObjectURL: created, revokeObjectURL: revoked });
    created.mockClear();
    revoked.mockClear();
  });

  it("saves the file under the name the server gave it", async () => {
    get.mockResolvedValue({ data: new Blob(["x"]), headers: { "content-disposition": 'attachment; filename="shortage.xlsx"' } });
    await downloadLinked("/reports/shortage/export");

    expect(get).toHaveBeenCalledWith("/reports/shortage/export", { responseType: "blob" });
    expect(links[0]).toMatchObject({ download: "shortage.xlsx" });
    expect(links[0].href).toContain("blob:report");
    expect(links[0].click).toHaveBeenCalledOnce();
    expect(revoked).toHaveBeenCalledWith("blob:report");
  });

  it("falls back to a plain name when the server sends none", async () => {
    get.mockResolvedValue({ data: new Blob(["x"]), headers: {} });
    await downloadLinked("/reports/x");

    expect(links[0].download).toBe("download");
  });
});
