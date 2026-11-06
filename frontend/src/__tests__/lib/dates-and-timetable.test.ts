import { describe, expect, it } from "vitest";
import { blockPosition, HOUR_PX, hourRange, toClock, toMinutes, visibleDays } from "@/lib/classTimetable";
import {
  formatDateIndian,
  formatDateIndianMedium,
  formatDateTimeIndian,
  formatTimeIndian,
} from "@/lib/dateFormatter";
import { classAction, classStatus, countByStatus, type StatusInput } from "@/lib/teacher/classStatus";
import { buildTimetable } from "@/lib/teacher/timetableGrid";
import {
  dayNumber,
  dayOf,
  formatWeekRange,
  isValidDay,
  shiftDays,
  todayIso,
  weekDays,
  weekdayName,
  weekStart,
} from "@/lib/teacher/weekDates";
import { formatPercent } from "@/lib/reports";
import { cn } from "@/lib/utils";

describe("Indian date formatting", () => {
  it("shows a UTC instant in IST", () => {
    expect(formatDateIndian("2026-11-02T20:00:00Z")).toBe("03/11/2026");
    expect(formatDateIndianMedium("2026-11-02T10:00:00Z")).toBe("2 Nov 2026");
    expect(formatTimeIndian("2026-11-02T04:00:00Z")).toMatch(/09:30\s?am/i);
    expect(formatDateTimeIndian("2026-11-02T04:00:00Z")).toMatch(/2 Nov 2026.*09:30\s?am/i);
  });

  it.each([null, undefined, "", "not a date"])("falls back for %j", (value) => {
    expect(formatDateIndian(value)).toBe("—");
    expect(formatDateTimeIndian(value, "n/a")).toBe("n/a");
  });
});

describe("clock maths", () => {
  it("converts between clock strings and minutes", () => {
    expect(toMinutes("09:30")).toBe(570);
    expect(toClock(570)).toBe("09:30");
  });

  it("clamps to the day", () => {
    expect(toClock(-5)).toBe("00:00");
    expect(toClock(99999)).toBe("23:59");
  });
});

describe("timetable layout", () => {
  const entry = (day_of_week: number, start_time: string, end_time: string) => ({ day_of_week, start_time, end_time });

  it("shows 08:00 to 17:00 by default and widens for early or late classes", () => {
    expect(hourRange([])).toEqual({ startHour: 8, endHour: 17 });
    expect(hourRange([entry(1, "07:15", "18:30")])).toEqual({ startHour: 7, endHour: 19 });
  });

  it("never runs past midnight", () => {
    expect(hourRange([entry(1, "20:00", "23:59")]).endHour).toBe(24);
  });

  it("shows Saturday and Sunday only when they hold a class", () => {
    expect(visibleDays([entry(1, "09:00", "10:00")])).toEqual([1, 2, 3, 4, 5]);
    expect(visibleDays([entry(6, "09:00", "10:00")])).toEqual([1, 2, 3, 4, 5, 6]);
    expect(visibleDays([entry(7, "09:00", "10:00"), entry(6, "09:00", "10:00")])).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("places a block by its start and length", () => {
    expect(blockPosition(entry(1, "09:30", "11:00"), 8)).toEqual({ top: 1.5 * HOUR_PX, height: 1.5 * HOUR_PX });
  });
});

describe("week dates", () => {
  it("finds the Monday of any day in the week", () => {
    expect(weekStart("2026-11-02")).toBe("2026-11-02");
    expect(weekStart("2026-11-08")).toBe("2026-11-02");
    expect(weekStart("2026-11-05")).toBe("2026-11-02");
  });

  it("lists seven days from Monday", () => {
    const days = weekDays("2026-11-02");
    expect(days).toHaveLength(7);
    expect(days[0]).toBe("2026-11-02");
    expect(days[6]).toBe("2026-11-08");
  });

  it("shifts across month and year ends", () => {
    expect(shiftDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("names days and formats a week range", () => {
    expect(weekdayName("2026-11-02")).toBe("Mon");
    expect(dayNumber("2026-11-02")).toBe(2);
    expect(formatWeekRange("2026-11-02")).toBe("2 Nov – 8 Nov 2026");
    expect(formatWeekRange("2026-12-28")).toBe("28 Dec – 3 Jan 2027");
  });

  it("validates calendar dates", () => {
    expect(isValidDay("2026-02-28")).toBe(true);
    expect(isValidDay("2026-02-30")).toBe(false);
    expect(isValidDay("02-11-2026")).toBe(false);
  });

  it("keeps the day part of an API timestamp", () => {
    expect(dayOf("2026-11-02T00:00:00Z")).toBe("2026-11-02");
  });

  it("reads today in the local time zone", () => {
    expect(todayIso(new Date(2026, 10, 2, 23, 59))).toBe("2026-11-02");
    expect(todayIso(new Date(2026, 10, 2, 0, 1))).toBe("2026-11-02");
  });
});

describe("class status", () => {
  const NOW = Date.parse("2026-11-02T10:00:00Z");
  const base: StatusInput = {
    date: "2026-11-02T00:00:00Z",
    status: "SCHEDULED",
    is_attendance_locked: false,
    verification_active: false,
  };
  const status = (overrides: Partial<StatusInput>, today = "2026-11-02") => classStatus({ ...base, ...overrides }, today, NOW);

  it("treats a cancelled class as cancelled, even when locked", () => {
    expect(status({ status: "CANCELLED", is_attendance_locked: true })).toBe("CANCELLED");
  });

  it("is DONE once the register is locked", () => {
    expect(status({ is_attendance_locked: true })).toBe("DONE");
  });

  it("is LIVE while the window is open and not yet expired", () => {
    const open = { verification_active: true, verification_expires: "2026-11-02T10:05:00Z" };
    expect(status(open)).toBe("LIVE");
    expect(status({ ...open, verification_expires: "2026-11-02T09:59:00Z" })).toBe("PENDING");
  });

  it("counts a class whose attendance was started as DONE after the window closes", () => {
    expect(status({ status: "CONDUCTED" })).toBe("DONE");
  });

  it("is PENDING today, UPCOMING later and MISSED earlier", () => {
    expect(status({})).toBe("PENDING");
    expect(status({ date: "2026-11-03T00:00:00Z" })).toBe("UPCOMING");
    expect(status({ date: "2026-11-01T00:00:00Z" })).toBe("MISSED");
  });

  it("starts a pending class, opens a live or done one and leaves the rest alone", () => {
    expect(classAction("PENDING")).toBe("start");
    expect(classAction("LIVE")).toBe("open");
    expect(classAction("DONE")).toBe("open");
    expect(["MISSED", "UPCOMING", "CANCELLED"].map((s) => classAction(s as never))).toEqual(["none", "none", "none"]);
  });

  it("counts classes by status", () => {
    const items = [{ ...base }, { ...base, is_attendance_locked: true }, { ...base, status: "CANCELLED" }];
    expect(countByStatus(items, "2026-11-02", NOW)).toEqual({
      DONE: 1, LIVE: 0, PENDING: 1, UPCOMING: 0, MISSED: 0, CANCELLED: 1,
    });
  });
});

describe("timetable grid", () => {
  const week = weekDays("2026-11-02");
  const row = (date: string, start_time: string, end_time: string) => ({ date: `${date}T00:00:00Z`, start_time, end_time });

  it("shows Monday to Friday and adds a weekend day only when it has a class", () => {
    expect(buildTimetable(week, []).days).toHaveLength(5);
    expect(buildTimetable(week, [row("2026-11-07", "09:00", "10:00")]).days).toHaveLength(6);
  });

  it("orders slots by time and groups classes sharing a slot and day", () => {
    const a = row("2026-11-02", "11:00", "12:00");
    const b = row("2026-11-02", "09:00", "10:00");
    const c = row("2026-11-02", "09:00", "10:00");
    const grid = buildTimetable(week, [a, b, c]);

    expect(grid.rows.map((r) => r.start)).toEqual(["09:00", "11:00"]);
    expect(grid.rows[0].byDay["2026-11-02"]).toHaveLength(2);
  });
});

describe("small helpers", () => {
  it("formats percentages without float noise and shows a dash when there is nothing", () => {
    expect(formatPercent(66.666)).toBe("66.7%");
    expect(formatPercent(0)).toBe("0%");
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(undefined)).toBe("—");
  });

  it("merges class names, the later Tailwind class winning", () => {
    expect(cn("p-2", false && "hidden", "p-4")).toBe("p-4");
  });
});
