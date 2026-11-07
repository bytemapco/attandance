import { describe, expect, it } from "vitest";
import { todaysClasses } from "@/lib/teacher/todaysClasses";
import type { DailyOccurrenceItem, TeacherClassItem } from "@/types";

function classItem(id: string, name: string): TeacherClassItem {
  return { course_section_id: id, class_code: "CE-A", subject_name: name, subject_code: name.slice(0, 3), student_count: 30 };
}

function lesson(sectionId: string, start: string, end: string, status: DailyOccurrenceItem["status"] = "SCHEDULED"): DailyOccurrenceItem {
  return {
    id: `${sectionId}-${start}`, course_section_id: sectionId, date: "2026-11-09", status, is_attendance_locked: false,
    verification_active: false, class_code: "CE-A", course_name: "x", subject_code: "x", section_name: "A",
    classroom_name: "R1", start_time: start, end_time: end, present_count: 0, total_enrolled: 30,
  };
}

const MATHS = classItem("s1", "Maths");
const PHYSICS = classItem("s2", "Physics");
const CHEMISTRY = classItem("s3", "Chemistry");

describe("todaysClasses", () => {
  it("keeps only the classes that have a lesson today", () => {
    const result = todaysClasses([MATHS, PHYSICS, CHEMISTRY], [lesson("s3", "09:00", "10:00")]);

    expect(result.map((entry) => entry.item.subject_name)).toEqual(["Chemistry"]);
  });

  it("puts the earliest lesson first and shows when each meets", () => {
    const result = todaysClasses([MATHS, PHYSICS], [lesson("s1", "11:00", "12:00"), lesson("s2", "09:00", "10:00")]);

    expect(result.map((entry) => [entry.item.subject_name, entry.times])).toEqual([
      ["Physics", "09:00–10:00"],
      ["Maths", "11:00–12:00"],
    ]);
  });

  it("lists both lessons of a class that meets twice", () => {
    const result = todaysClasses([MATHS], [lesson("s1", "14:00", "15:00"), lesson("s1", "09:00", "10:00")]);

    expect(result).toHaveLength(1);
    expect(result[0].times).toBe("09:00–10:00, 14:00–15:00");
  });

  it("leaves out a class whose only lesson today is cancelled", () => {
    expect(todaysClasses([MATHS], [lesson("s1", "09:00", "10:00", "CANCELLED")])).toEqual([]);
  });

  it("ignores lessons of a class the teacher does not have", () => {
    expect(todaysClasses([MATHS], [lesson("other", "09:00", "10:00")])).toEqual([]);
  });
});
