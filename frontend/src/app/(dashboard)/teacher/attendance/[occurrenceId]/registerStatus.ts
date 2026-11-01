import type { RegisterStudentItem } from "@/types";

export type MarkStatus = "PRESENT" | "ABSENT";
export type DisplayStatus = MarkStatus | "WAITING" | "FLAGGED" | "EXCUSED";
export type RegisterFilter = "ALL" | DisplayStatus;
export type Edits = Record<string, MarkStatus>;
export type Counts = Record<RegisterFilter, number>;

const METHOD_LABEL: Record<string, string> = {
  AI_BIOMETRIC: "Face",
  QR_CODE: "QR code",
  SMART_PASS_OFFLINE: "Smart Pass",
  MANUAL_REGISTER: "Teacher",
  MANUAL_OVERRIDE: "Teacher",
  SYSTEM_EXCUSED: "On leave",
};

/**
 * What the teacher sees. A student with no record yet is "Waiting", never "Absent",
 * until the teacher says so or the session is locked. Late/Approved count as Present.
 */
export function displayStatus(student: RegisterStudentItem, edits: Edits, locked: boolean): DisplayStatus {
  const edit = edits[student.student_id];
  if (edit) return edit;
  switch (student.status) {
    case "PRESENT":
    case "LATE":
    case "APPROVED":
      return "PRESENT";
    case "FLAGGED":
      return "FLAGGED";
    case "EXCUSED":
      return "EXCUSED";
    default:
      return student.verified_at || locked ? "ABSENT" : "WAITING";
  }
}

export function changedStudents(students: RegisterStudentItem[], edits: Edits, locked: boolean): RegisterStudentItem[] {
  return students.filter((s) => edits[s.student_id] && edits[s.student_id] !== displayStatus(s, {}, locked));
}

export function tally(students: RegisterStudentItem[], edits: Edits, locked: boolean): Counts {
  const counts: Counts = { ALL: students.length, PRESENT: 0, ABSENT: 0, WAITING: 0, FLAGGED: 0, EXCUSED: 0 };
  students.forEach((s) => {
    counts[displayStatus(s, edits, locked)] += 1;
  });
  return counts;
}

export function markedBy(student: RegisterStudentItem): string | null {
  if (!student.verified_at) return null;
  return METHOD_LABEL[student.method] ?? student.method;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}
