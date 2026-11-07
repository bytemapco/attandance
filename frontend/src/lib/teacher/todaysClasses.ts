import type { DailyOccurrenceItem, TeacherClassItem } from "@/types";

export interface TodaysClass {
  item: TeacherClassItem;
  /** When it meets today, such as "09:00–10:00". A class with two lessons lists both. */
  times: string;
}

/** The classes that have a lesson today, earliest first. A cancelled lesson does not count. */
export function todaysClasses(classes: TeacherClassItem[], schedule: DailyOccurrenceItem[]): TodaysClass[] {
  const lessons = new Map<string, DailyOccurrenceItem[]>();
  for (const lesson of schedule) {
    if (lesson.status === "CANCELLED") continue;
    lessons.set(lesson.course_section_id, [...(lessons.get(lesson.course_section_id) ?? []), lesson]);
  }
  return classes
    .filter((item) => lessons.has(item.course_section_id))
    .map((item) => {
      const ordered = [...(lessons.get(item.course_section_id) ?? [])].sort((a, b) => a.start_time.localeCompare(b.start_time));
      return { item, times: ordered.map((lesson) => `${lesson.start_time}–${lesson.end_time}`).join(", ") };
    })
    .sort((a, b) => a.times.localeCompare(b.times));
}
