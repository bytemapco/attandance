import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rememberConversation, savedConversation } from "@/lib/agent/savedChat";

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("the remembered conversation", () => {
  it("is nothing until one is remembered", () => {
    expect(savedConversation("u1")).toBeNull();
  });

  it("is kept for each person separately", () => {
    rememberConversation("u1", "c1");
    rememberConversation("u2", "c2");
    expect(savedConversation("u1")).toBe("c1");
    expect(savedConversation("u2")).toBe("c2");
  });

  it("is replaced by a newer one", () => {
    rememberConversation("u1", "c1");
    rememberConversation("u1", "c5");
    expect(savedConversation("u1")).toBe("c5");
  });

  it("is forgotten when set to nothing, for that person only", () => {
    rememberConversation("u1", "c1");
    rememberConversation("u2", "c2");
    rememberConversation("u1", null);
    expect(savedConversation("u1")).toBeNull();
    expect(savedConversation("u2")).toBe("c2");
  });

  it("does not break the chat when the browser blocks storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });

    expect(savedConversation("u1")).toBeNull();
    expect(() => rememberConversation("u1", "c1")).not.toThrow();
    expect(() => rememberConversation("u1", null)).not.toThrow();
  });
});
