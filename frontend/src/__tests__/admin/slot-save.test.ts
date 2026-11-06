import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveSlot, type SaveArgs } from "@/app/(dashboard)/admin/class-management/[id]/slotSave";
import type { ClassDetail } from "@/types";

const { post, put, remove } = vi.hoisted(() => ({ post: vi.fn(), put: vi.fn(), remove: vi.fn() }));

vi.mock("@/lib/api", () => ({
  default: { post, put, delete: remove },
  getApiErrorMessage: (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback),
}));

function classWith(sections: { id: string; subject_id: string; teacher_id: string | null }[]): ClassDetail {
  return { id: "cls-1", sections } as unknown as ClassDetail;
}

const SUBJECT = "sub-1";
const TEACHER = "t-1";
const MONDAY_TO_WEDNESDAY = [1, 2, 3];

function args(cls: ClassDetail, extra: Partial<SaveArgs> = {}): SaveArgs {
  return {
    cls,
    draft: { sectionId: "", day: 1, start: "09:00", end: "10:00" },
    subjectId: SUBJECT,
    teacherId: TEACHER,
    days: MONDAY_TO_WEDNESDAY,
    input: { start_time: "09:00", end_time: "10:00" },
    ...extra,
  };
}

function rejection(message: string): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  return new AxiosError(message, "ERR_BAD_REQUEST", config, null, {
    data: { detail: message }, status: 409, statusText: "", headers: {}, config,
  });
}

const detail = (label: string): ClassDetail => ({ id: label, sections: [{ id: "sec-new", subject_id: SUBJECT }] }) as unknown as ClassDetail;

beforeEach(() => {
  post.mockReset();
  put.mockReset();
  remove.mockReset();
});

describe("saving a class time for a subject already in the class", () => {
  const existing = classWith([{ id: "sec-1", subject_id: SUBJECT, teacher_id: TEACHER }]);

  it("adds the time on each chosen day", async () => {
    post.mockResolvedValue({ data: detail("after") });

    const result = await saveSlot(args(existing));

    expect(post).toHaveBeenCalledTimes(3);
    expect(post.mock.calls.map((call) => call[1].day_of_week)).toEqual(MONDAY_TO_WEDNESDAY);
    expect(result).toMatchObject({ ok: true, message: "" });
    expect(result.latest?.id).toBe("after");
  });

  it("keeps the days that worked and names the ones that did not", async () => {
    post
      .mockResolvedValueOnce({ data: detail("after-mon") })
      .mockRejectedValueOnce(rejection("This teacher already has a class at that time."))
      .mockResolvedValueOnce({ data: detail("after-wed") });

    const result = await saveSlot(args(existing));

    expect(result.ok).toBe(false);
    expect(result.message).toBe("Tue: This teacher already has a class at that time.");
    expect(result.latest?.id).toBe("after-wed");
  });

  it("changes the teacher first when a different one is chosen", async () => {
    put.mockResolvedValue({ data: detail("teacher-changed") });
    post.mockResolvedValue({ data: detail("after") });

    await saveSlot(args(existing, { teacherId: "t-2" }));

    expect(put).toHaveBeenCalledWith("/admin/class-management/classes/cls-1/sections/sec-1", { primary_teacher_id: "t-2" });
  });

  it("does not touch the teacher when it is unchanged", async () => {
    post.mockResolvedValue({ data: detail("after") });
    await saveSlot(args(existing));
    expect(put).not.toHaveBeenCalled();
  });
});

describe("saving for a subject not yet in the class", () => {
  const empty = classWith([]);

  it("adds the subject with its teacher before scheduling it", async () => {
    post.mockResolvedValueOnce({ data: detail("with-subject") }).mockResolvedValue({ data: detail("scheduled") });

    const result = await saveSlot(args(empty, { days: [1] }));

    expect(post.mock.calls[0]).toEqual([
      "/admin/class-management/classes/cls-1/sections",
      { subject_id: SUBJECT, primary_teacher_id: TEACHER },
    ]);
    expect(result.ok).toBe(true);
  });

  it("takes the new subject out again when no time could be saved", async () => {
    post
      .mockResolvedValueOnce({ data: detail("with-subject") })
      .mockRejectedValue(rejection("That room is already booked at that time."));
    remove.mockResolvedValue({ data: detail("restored") });

    const result = await saveSlot(args(empty, { days: [1] }));

    expect(remove).toHaveBeenCalledWith("/admin/class-management/classes/cls-1/sections/sec-new");
    expect(result).toMatchObject({ ok: false, message: "Mon: That room is already booked at that time." });
    expect(result.latest?.id).toBe("restored");
  });

  it("keeps the new subject when at least one time was saved", async () => {
    post
      .mockResolvedValueOnce({ data: detail("with-subject") })
      .mockResolvedValueOnce({ data: detail("mon-ok") })
      .mockRejectedValueOnce(rejection("clash"));

    const result = await saveSlot(args(empty, { days: [1, 2] }));

    expect(remove).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });
});

describe("changing an existing class time", () => {
  const existing = classWith([{ id: "sec-1", subject_id: SUBJECT, teacher_id: TEACHER }]);
  const changing = { draft: { sectionId: "sec-1", day: 1, start: "09:00", end: "10:00", ruleId: "rule-1" } };

  it("removes the old time before adding the new one", async () => {
    remove.mockResolvedValue({ data: detail("removed") });
    post.mockResolvedValue({ data: detail("added") });

    await saveSlot(args(existing, { ...changing, days: [1], input: { start_time: "10:00", end_time: "11:00" } }));

    expect(remove).toHaveBeenCalledWith("/admin/class-management/classes/cls-1/sections/sec-1/schedule/rule-1");
    expect(remove.mock.invocationCallOrder[0]).toBeLessThan(post.mock.invocationCallOrder[0]);
  });

  it("puts the old time back, in its old room, when the new one is rejected", async () => {
    remove.mockResolvedValue({ data: detail("removed") });
    post
      .mockRejectedValueOnce(rejection("clash"))
      .mockResolvedValueOnce({ data: detail("restored") });

    const result = await saveSlot(
      args(existing, { ...changing, days: [1], input: { start_time: "10:00", end_time: "11:00" }, previousRoomId: "room-7" }),
    );

    expect(post).toHaveBeenLastCalledWith(
      "/admin/class-management/classes/cls-1/sections/sec-1/schedule",
      { day_of_week: 1, start_time: "09:00", end_time: "10:00", classroom_id: "room-7" },
    );
    expect(result.ok).toBe(false);
    expect(result.latest?.id).toBe("restored");
  });
});

describe("when the server fails outright", () => {
  it("reports the error and does not throw", async () => {
    put.mockRejectedValue(new Error("Network down"));
    const cls = classWith([{ id: "sec-1", subject_id: SUBJECT, teacher_id: "someone-else" }]);

    const result = await saveSlot(args(cls));

    expect(result).toMatchObject({ ok: false, message: "Network down", latest: null });
  });
});
