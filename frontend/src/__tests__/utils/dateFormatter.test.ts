import { describe, it, expect } from "vitest";
import {
  formatDateIndian,
  formatDateIndianMedium,
  formatDateTimeIndian,
  formatTimeIndian,
} from "@/utils/dateFormatter";

describe("dateFormatter (Indian Standard Time Locale)", () => {
  it("formats standard date into DD/MM/YYYY", () => {
    const formatted = formatDateIndian("2026-10-31T06:00:00Z");
    expect(formatted).toMatch(/31\/10\/2026/);
  });

  it("formats medium date into DD Mon YYYY", () => {
    const formatted = formatDateIndianMedium("2026-08-15T00:00:00Z");
    expect(formatted).toContain("15");
    expect(formatted).toContain("Aug");
    expect(formatted).toContain("2026");
  });

  it("formats time into 12-hour format with AM/PM", () => {
    const formatted = formatTimeIndian("2026-10-31T09:30:00Z");
    expect(formatted).toMatch(/(AM|PM|am|pm)/);
  });

  it("handles empty or invalid dates gracefully with fallback", () => {
    expect(formatDateIndian(null)).toBe("—");
    expect(formatDateIndian("invalid-date")).toBe("—");
    expect(formatDateIndianMedium(undefined, "N/A")).toBe("N/A");
  });
});
