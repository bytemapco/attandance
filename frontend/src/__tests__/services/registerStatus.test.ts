import { describe, it, expect } from "vitest";
import {
  changedStudents, displayStatus, tally,
} from "@/app/(dashboard)/teacher/attendance/[occurrenceId]/registerStatus";
import type { RegisterStudentItem } from "@/types";

function student(id: string, status: RegisterStudentItem["status"], verifiedAt: string | null = null): RegisterStudentItem {
  return {
    student_id: id, student_name: id, enrollment_number: id, status, method: "MANUAL_REGISTER", verified_at: verifiedAt,
  };
}

describe("displayStatus", () => {
  it("shows an unmarked student as Waiting while live, never Absent", () => {
    expect(displayStatus(student("a", "ABSENT"), {}, false)).toBe("WAITING");
  });

  it("shows the same student as Absent once the register is locked", () => {
    expect(displayStatus(student("a", "ABSENT"), {}, true)).toBe("ABSENT");
  });

  it("keeps an explicitly saved absence as Absent while live", () => {
    expect(displayStatus(student("a", "ABSENT", "2026-11-01T09:00:00Z"), {}, false)).toBe("ABSENT");
  });

  it("counts Late and Approved records as Present", () => {
    expect(displayStatus(student("a", "LATE", "t"), {}, false)).toBe("PRESENT");
    expect(displayStatus(student("b", "APPROVED", "t"), {}, false)).toBe("PRESENT");
  });

  it("lets an unsaved edit win", () => {
    expect(displayStatus(student("a", "FLAGGED", "t"), { a: "PRESENT" }, false)).toBe("PRESENT");
  });
});

describe("changedStudents and tally", () => {
  const roster = [student("a", "ABSENT"), student("b", "PRESENT", "t"), student("c", "FLAGGED", "t")];

  it("only reports edits that differ from what is saved", () => {
    const changed = changedStudents(roster, { a: "PRESENT", b: "PRESENT", c: "ABSENT" }, false);
    expect(changed.map((s) => s.student_id)).toEqual(["a", "c"]);
  });

  it("counts every student exactly once, including unsaved edits", () => {
    const counts = tally(roster, { a: "PRESENT" }, false);
    expect(counts).toMatchObject({ ALL: 3, PRESENT: 2, WAITING: 0, FLAGGED: 1, ABSENT: 0 });
  });
});
