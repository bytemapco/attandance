import api, { getApiErrorMessage } from "@/lib/api";
import type { ClassDetail } from "@/types";
import { WEEKDAYS } from "./weekdays";

export interface SlotInput {
  start_time: string;
  end_time: string;
  classroom_id?: string;
}

export interface AddResult {
  /** The class as it stands after the last time that was saved, or null when none was. */
  latest: ClassDetail | null;
  added: number[];
  failed: { day: number; message: string }[];
}

export function schedulePath(classId: string, sectionId: string): string {
  return `/admin/class-management/classes/${classId}/sections/${sectionId}/schedule`;
}

/** Adds the same time on each day. One day failing does not stop the others. */
export async function addTimes(path: string, days: number[], input: SlotInput): Promise<AddResult> {
  const result: AddResult = { latest: null, added: [], failed: [] };
  for (const day of days) {
    try {
      const { data } = await api.post<ClassDetail>(path, { day_of_week: day, ...input });
      result.latest = data;
      result.added.push(day);
    } catch (err: unknown) {
      result.failed.push({ day, message: getApiErrorMessage(err, "could not be added") });
    }
  }
  return result;
}

export function failureText(failed: AddResult["failed"]): string {
  return failed.map((f) => `${WEEKDAYS[f.day - 1]}: ${f.message}`).join("\n");
}
