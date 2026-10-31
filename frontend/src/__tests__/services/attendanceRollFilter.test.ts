import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAttendanceRollFilter } from "@/app/(dashboard)/teacher/sessions/[id]/attendance-roll/useAttendanceRollFilter";
import type { SessionStudentAttendanceItem } from "@/types";

const mockRoll: SessionStudentAttendanceItem[] = [
  {
    student_id: "s1",
    enrollment_number: "EN-001",
    full_name: "Alice Smith",
    email: "alice@test.edu",
    status: "Present",
    final_score: 0.95,
    marked_at: "2026-10-31T09:00:00Z",
  },
  {
    student_id: "s2",
    enrollment_number: "EN-002",
    full_name: "Bob Jones",
    email: "bob@test.edu",
    status: "Absent",
    final_score: 0.0,
    marked_at: null,
  },
  {
    student_id: "s3",
    enrollment_number: "EN-003",
    full_name: "Charlie Brown",
    email: "charlie@test.edu",
    status: "Flagged",
    final_score: 0.55,
    marked_at: "2026-10-31T09:05:00Z",
  },
];

describe("useAttendanceRollFilter", () => {
  it("computes attendance counts accurately", () => {
    const { result } = renderHook(() =>
      useAttendanceRollFilter({
        rollItems: mockRoll,
        statusFilter: "all",
        searchQuery: "",
      })
    );

    expect(result.current.counts).toEqual({
      all: 3,
      present: 1,
      absent: 1,
      flagged: 1,
    });
    expect(result.current.filteredItems).toHaveLength(3);
  });

  it("filters roll items by Present status", () => {
    const { result } = renderHook(() =>
      useAttendanceRollFilter({
        rollItems: mockRoll,
        statusFilter: "Present",
        searchQuery: "",
      })
    );

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].student_id).toBe("s1");
  });

  it("filters roll items by search query", () => {
    const { result } = renderHook(() =>
      useAttendanceRollFilter({
        rollItems: mockRoll,
        statusFilter: "all",
        searchQuery: "bob",
      })
    );

    expect(result.current.filteredItems).toHaveLength(1);
    expect(result.current.filteredItems[0].full_name).toBe("Bob Jones");
  });
});
