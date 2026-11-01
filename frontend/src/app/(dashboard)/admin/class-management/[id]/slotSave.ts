import api, { getApiErrorMessage } from "@/lib/api";
import type { ClassDetail } from "@/types";
import { addTimes, failureText, schedulePath, type SlotInput } from "./scheduleApi";

export interface SlotDraft {
  /** The subject's section in this class, or "" when the subject is not in the class yet. */
  sectionId: string;
  day: number;
  start: string;
  end: string;
  roomName?: string | null;
  /** Set when an existing class time is being changed. */
  ruleId?: string;
}

export interface SaveArgs {
  cls: ClassDetail;
  draft: SlotDraft;
  subjectId: string;
  teacherId: string;
  days: number[];
  input: SlotInput;
  /** The room the changed class time had, to put it back if the change fails. */
  previousRoomId?: string;
}

export interface SaveResult {
  /** The class after the last change that reached the server. Null when nothing changed. */
  latest: ClassDetail | null;
  /** True when every wanted time was saved. */
  ok: boolean;
  message: string;
}

const sectionsPath = (classId: string): string => `/admin/class-management/classes/${classId}/sections`;

/**
 * Saves one class time. If the subject is not in the class it is added with its teacher; if the
 * teacher differs it is changed. When no time can be saved, a new subject is taken out again and a
 * changed time is put back, so a rejected save leaves the class as it was.
 */
export async function saveSlot(args: SaveArgs): Promise<SaveResult> {
  const { cls, draft, subjectId, teacherId, days, input } = args;
  let latest: ClassDetail | null = null;
  try {
    let section = cls.sections.find((s) => s.subject_id === subjectId);
    const created = !section;
    if (!section) {
      latest = (await api.post<ClassDetail>(sectionsPath(cls.id), { subject_id: subjectId, primary_teacher_id: teacherId })).data;
      section = latest.sections.find((s) => s.subject_id === subjectId);
    } else if (section.teacher_id !== teacherId) {
      latest = (await api.put<ClassDetail>(`${sectionsPath(cls.id)}/${section.id}`, { primary_teacher_id: teacherId })).data;
    }
    if (!section) return { latest, ok: false, message: "The subject could not be added to the class." };

    const path = schedulePath(cls.id, section.id);
    if (draft.ruleId) latest = (await api.delete<ClassDetail>(`${path}/${draft.ruleId}`)).data;

    const result = await addTimes(path, days, input);
    latest = result.latest ?? latest;
    if (result.added.length > 0) return { latest, ok: result.failed.length === 0, message: failureText(result.failed) };

    if (draft.ruleId) {
      const restore = { start_time: draft.start, end_time: draft.end, classroom_id: args.previousRoomId };
      latest = (await addTimes(path, [draft.day], restore)).latest ?? latest;
    }
    if (created) latest = (await api.delete<ClassDetail>(`${sectionsPath(cls.id)}/${section.id}`)).data;
    return { latest, ok: false, message: failureText(result.failed) };
  } catch (err: unknown) {
    return { latest, ok: false, message: getApiErrorMessage(err, "Could not save the class time") };
  }
}
