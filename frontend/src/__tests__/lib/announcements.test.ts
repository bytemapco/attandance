import { describe, expect, it } from "vitest";
import { fromLocalInput, nextHour, toLocalInput } from "@/lib/announcements/schedule";
import { isFirstSighting, liveNotification, toastText } from "@/lib/notifications/live";

describe("schedule times", () => {
  it("turns a moment into the value a date-time input takes, on the person's own clock", () => {
    expect(toLocalInput(new Date(2026, 10, 7, 9, 5))).toBe("2026-11-07T09:05");
  });

  it("turns what the input holds back into the same moment", () => {
    const local = new Date(2026, 10, 7, 14, 30);
    expect(fromLocalInput(toLocalInput(local))).toBe(local.toISOString());
  });

  it("gives nothing for an empty or invalid input", () => {
    expect(fromLocalInput("")).toBeUndefined();
    expect(fromLocalInput("not a date")).toBeUndefined();
  });

  it("suggests the next whole hour", () => {
    const next = new Date(nextHour(new Date(2026, 10, 7, 9, 40, 30)));
    expect([next.getHours(), next.getMinutes(), next.getSeconds()]).toEqual([10, 0, 0]);
  });
});

describe("pushed notifications", () => {
  const data = { id: "a1", kind: "announcement", sender_id: "u9", title: "Holiday", message: "Closed", type: "warning" };

  it("reads a pushed announcement", () => {
    expect(liveNotification({ event: "NOTIFICATION_RECEIVED", data })).toEqual({
      id: "a1", kind: "announcement", sender_id: "u9", title: "Holiday", message: "Closed", type: "warning",
    });
  });

  it("treats anything that is not a personal announcement as personal, and a missing sender as none", () => {
    const parsed = liveNotification({ event: "NOTIFICATION_RECEIVED", data: { id: "p1", title: "Leave approved" } });
    expect(parsed).toMatchObject({ kind: "personal", sender_id: null, message: "", type: "info" });
  });

  it.each([
    ["another event", { event: "SOMETHING_ELSE", data }],
    ["no data", { event: "NOTIFICATION_RECEIVED" }],
    ["no id", { event: "NOTIFICATION_RECEIVED", data: { title: "x" } }],
    ["no title", { event: "NOTIFICATION_RECEIVED", data: { id: "x" } }],
  ])("ignores a message with %s", (_, message) => {
    expect(liveNotification(message)).toBeNull();
  });

  it("writes the toast with the message when there is one", () => {
    expect(toastText({ id: "1", kind: "personal", title: "A", message: "B", type: "info" })).toBe("A: B");
    expect(toastText({ id: "1", kind: "personal", title: "A", message: "", type: "info" })).toBe("A");
  });

  it("says yes only the first time it hears of an id", () => {
    expect([isFirstSighting("live-test-1"), isFirstSighting("live-test-1"), isFirstSighting("live-test-2")]).toEqual([true, false, true]);
  });
});
