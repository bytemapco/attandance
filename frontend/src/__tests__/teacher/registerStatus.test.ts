import { describe, expect, it } from "vitest";
import {
  changedStudents,
  displayStatus,
  evidenceLine,
  flaggedForReview,
  initials,
  isTypingTarget,
  markedBy,
  pendingFlagsText,
  tally,
} from "@/app/(dashboard)/teacher/attendance/[occurrenceId]/registerStatus";
import { occurrenceState } from "@/app/(dashboard)/teacher/attendance/occurrenceState";
import type { RegisterStudentItem } from "@/types";

function student(overrides: Partial<RegisterStudentItem> = {}): RegisterStudentItem {
  return {
    record_id: null,
    student_id: "s1",
    student_name: "Asha Rao",
    enrollment_number: "EN001",
    status: "ABSENT",
    method: "MANUAL_REGISTER",
    verified_at: null,
    ...overrides,
  };
}

describe("displayStatus", () => {
  it("shows a student with no record yet as Waiting, never Absent", () => {
    expect(displayStatus(student(), {}, false)).toBe("WAITING");
  });

  it("shows Absent once the teacher has acted on them or the register is locked", () => {
    expect(displayStatus(student({ verified_at: "2026-11-02T09:00:00Z" }), {}, false)).toBe("ABSENT");
    expect(displayStatus(student(), {}, true)).toBe("ABSENT");
  });

  it.each(["PRESENT", "LATE", "APPROVED"] as const)("counts %s as Present", (status) => {
    expect(displayStatus(student({ status }), {}, false)).toBe("PRESENT");
  });

  it("keeps Flagged and Excused as they are", () => {
    expect(displayStatus(student({ status: "FLAGGED" }), {}, false)).toBe("FLAGGED");
    expect(displayStatus(student({ status: "EXCUSED" }), {}, false)).toBe("EXCUSED");
  });

  it("lets an unsaved edit override everything", () => {
    expect(displayStatus(student({ status: "FLAGGED" }), { s1: "PRESENT" }, false)).toBe("PRESENT");
  });
});

describe("edits and counts", () => {
  const students = [
    student({ student_id: "a", status: "PRESENT" }),
    student({ student_id: "b" }),
    student({ student_id: "c", status: "FLAGGED", record_id: "r3" }),
    student({ student_id: "d", status: "EXCUSED" }),
  ];

  it("lists only students whose edit differs from what is saved", () => {
    const edits = { a: "PRESENT", b: "PRESENT", c: "ABSENT" } as const;
    expect(changedStudents(students, edits, false).map((s) => s.student_id)).toEqual(["b", "c"]);
  });

  it("tallies every student under their displayed status", () => {
    expect(tally(students, { b: "ABSENT" }, false)).toEqual({
      ALL: 4, PRESENT: 1, ABSENT: 1, WAITING: 0, FLAGGED: 1, EXCUSED: 1,
    });
  });

  it("offers flagged marks for a decision unless the grid already has an edit for them", () => {
    expect(flaggedForReview(students, {}).map((s) => s.student_id)).toEqual(["c"]);
    expect(flaggedForReview(students, { c: "ABSENT" })).toEqual([]);
  });

  it("does not offer a flagged student who has no saved record to decide on", () => {
    expect(flaggedForReview([student({ status: "FLAGGED", record_id: null })], {})).toEqual([]);
  });
});

describe("wording", () => {
  it("says how many flagged marks stay pending", () => {
    expect(pendingFlagsText(0)).toBe("");
    expect(pendingFlagsText(1)).toBe(" 1 mark still to verify will stay pending.");
    expect(pendingFlagsText(3)).toBe(" 3 marks still to verify will stay pending.");
  });

  it("names how a mark was made, and nothing for an unmarked student", () => {
    expect(markedBy(student())).toBeNull();
    expect(markedBy(student({ verified_at: "x", method: "QR_CODE" }))).toBe("QR code");
    expect(markedBy(student({ verified_at: "x", method: "SYSTEM_EXCUSED" }))).toBe("On leave");
    expect(markedBy(student({ verified_at: "x", method: "SOMETHING_NEW" }))).toBe("SOMETHING_NEW");
  });

  it("shows face scores as percentages", () => {
    const line = evidenceLine(
      student({ verified_at: "x", method: "AI_BIOMETRIC", face_score: 0.874, liveness_score: 0.5 }),
    );
    expect(line).toBe("Marked via Face · Face match 87% · Liveness 50%");
  });

  it("says a check was not run instead of showing a zero", () => {
    const line = evidenceLine(student({ verified_at: "x", method: "AI_BIOMETRIC", face_score: null, liveness_score: undefined }));
    expect(line).toBe("Marked via Face · Face match not checked · Liveness not checked");
  });

  it("gives non-face marks no scores", () => {
    expect(evidenceLine(student({ verified_at: "x", method: "QR_CODE" }))).toBe("Marked via QR code");
  });

  it("builds initials from the first and last name", () => {
    expect(initials("Asha Rao")).toBe("AR");
    expect(initials("  asha kumari rao ")).toBe("AR");
    expect(initials("Asha")).toBe("A");
    expect(initials("")).toBe("?");
  });
});

describe("isTypingTarget", () => {
  it("is true for form fields, so keyboard shortcuts do not fire while typing", () => {
    expect(isTypingTarget(document.createElement("input"))).toBe(true);
    expect(isTypingTarget(document.createElement("textarea"))).toBe(true);
    expect(isTypingTarget(document.createElement("select"))).toBe(true);
  });

  it("is false for other elements and for no target", () => {
    expect(isTypingTarget(document.createElement("div"))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe("occurrenceState", () => {
  const NOW = Date.parse("2026-11-02T10:00:00Z");
  const base = { status: "SCHEDULED", is_attendance_locked: false, verification_active: false };

  it("maps a class to its state", () => {
    expect(occurrenceState({ ...base, status: "CANCELLED", is_attendance_locked: true }, NOW)).toBe("CANCELLED");
    expect(occurrenceState({ ...base, is_attendance_locked: true }, NOW)).toBe("COMPLETED");
    expect(occurrenceState(base, NOW)).toBe("NOT_STARTED");
  });

  it("is live only while the window has not expired", () => {
    const open = { ...base, verification_active: true };
    expect(occurrenceState({ ...open, verification_expires: "2026-11-02T10:01:00Z" }, NOW)).toBe("LIVE");
    expect(occurrenceState({ ...open, verification_expires: "2026-11-02T09:59:00Z" }, NOW)).toBe("NOT_STARTED");
    expect(occurrenceState(open, NOW)).toBe("NOT_STARTED");
  });
});
