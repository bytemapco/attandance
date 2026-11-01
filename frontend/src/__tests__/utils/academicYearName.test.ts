import { describe, expect, it } from "vitest";
import { formatAcademicYearName } from "@/lib/utils";

describe("formatAcademicYearName", () => {
  it("includes month and year for both ends", () => {
    expect(formatAcademicYearName("2026-11-11", "2027-03-01")).toBe("Nov 2026 – Mar 2027");
  });

  it("collapses when start and end share a month", () => {
    expect(formatAcademicYearName("2026-06-01", "2026-06-30")).toBe("Jun 2026");
  });

  it("returns empty for missing or invalid dates", () => {
    expect(formatAcademicYearName("", "2027-03-01")).toBe("");
    expect(formatAcademicYearName("2026-13-01", "2027-03-01")).toBe("");
  });
});
