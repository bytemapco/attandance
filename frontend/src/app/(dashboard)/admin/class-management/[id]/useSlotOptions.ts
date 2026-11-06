import { useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import { useClassrooms, useSubjects } from "@/hooks/useReferenceData";
import type { ClassroomResponse, TeacherResponse } from "@/types";

interface Option {
  value: string;
  label: string;
}

interface SlotOptions {
  rooms: ClassroomResponse[];
  subjectOptions: Option[];
  teacherOptions: Option[];
  roomOptions: Option[];
}

/** Subjects of the class's department, all teachers and all rooms, for the class time dialog. */
export function useSlotOptions(departmentId: string): SlotOptions {
  const { items: subjects, failed: subjectsFailed } = useSubjects();
  const { items: rooms, failed: roomsFailed } = useClassrooms();
  const { data: teacherPage, error: teachersError } = useSWR<TeacherResponse[] | { items: TeacherResponse[] }>(
    "/admin/users/teachers?page_size=1000"
  );
  const teachers = useMemo(
    () => (Array.isArray(teacherPage) ? teacherPage : teacherPage?.items ?? []),
    [teacherPage]
  );

  useEffect(() => {
    if (subjectsFailed || roomsFailed || teachersError) toast.error("Could not load subjects, teachers and rooms");
  }, [subjectsFailed, roomsFailed, teachersError]);

  return useMemo(
    () => ({
      rooms,
      subjectOptions: subjects
        .filter((s) => !s.department_id || s.department_id === departmentId)
        .map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
      teacherOptions: teachers.map((t) => ({
        value: t.id,
        label: `${t.first_name} ${t.last_name}`.trim() + (t.department ? ` · ${t.department}` : ""),
      })),
      roomOptions: [{ value: "", label: "No room" }, ...rooms.map((r) => ({ value: r.id, label: r.name }))],
    }),
    [subjects, teachers, rooms, departmentId]
  );
}
