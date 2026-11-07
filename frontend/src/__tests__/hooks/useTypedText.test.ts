import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTypedText } from "@/hooks/useTypedText";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const wait = (ms: number): void => void act(() => void vi.advanceTimersByTime(ms));

describe("showing text as it is written", () => {
  it("shows text that is already complete at once, as a saved chat does", () => {
    const { result } = renderHook(() => useTypedText("Already here"));
    expect(result.current).toBe("Already here");
  });

  it("starts empty for an empty message", () => {
    expect(renderHook(() => useTypedText("")).result.current).toBe("");
  });

  it("reveals a piece that arrives all at once a little at a time, never out of order", () => {
    const text = "You have three classes today and one of them needs your attention.";
    const { result, rerender } = renderHook(({ value }) => useTypedText(value), { initialProps: { value: "" } });
    rerender({ value: text });

    const seen: string[] = [];
    for (let step = 0; step < 60; step += 1) {
      wait(16);
      seen.push(result.current);
    }

    expect(seen.some((part) => part.length > 0 && part.length < text.length)).toBe(true);
    expect(seen.every((part) => text.startsWith(part))).toBe(true);
    expect(seen.map((part) => part.length)).toEqual([...seen.map((part) => part.length)].sort((a, b) => a - b));
    expect(result.current).toBe(text);
  });

  it("speeds up when a lot of text is waiting, so a long answer never trails far behind", () => {
    const { result, rerender } = renderHook(({ value }) => useTypedText(value), { initialProps: { value: "" } });
    rerender({ value: "x".repeat(600) });

    wait(100);

    // Typing at the base speed alone would show about 7 characters in 100 ms.
    expect(result.current.length).toBeGreaterThan(60);
    expect(result.current.length).toBeLessThan(600);
  });

  it("keeps up with text that keeps arriving", () => {
    const { result, rerender } = renderHook(({ value }) => useTypedText(value), { initialProps: { value: "" } });
    let text = "";
    for (let piece = 0; piece < 5; piece += 1) {
      text += "A sentence that arrives in one go. ";
      rerender({ value: text });
      wait(40);
    }
    wait(1500);
    expect(result.current).toBe(text);
  });

  it("goes back to the shorter text when it is replaced, without showing text that is gone", () => {
    const { result, rerender } = renderHook(({ value }) => useTypedText(value), { initialProps: { value: "A long half-written answer" } });
    rerender({ value: "Unavailable" });
    expect(result.current).toBe("Unavailable");
  });

  it("shows everything at once when the person prefers less motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { result, rerender } = renderHook(({ value }) => useTypedText(value), { initialProps: { value: "" } });
    rerender({ value: "No animation for me" });
    expect(result.current).toBe("No animation for me");
  });

  it("stops its frame loop once it has caught up", () => {
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    const { result, rerender, unmount } = renderHook(({ value }) => useTypedText(value), { initialProps: { value: "" } });
    rerender({ value: "short" });
    wait(500);
    expect(result.current).toBe("short");
    unmount();
    expect(cancel).toHaveBeenCalled();
  });
});
