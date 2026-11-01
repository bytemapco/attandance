import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import type { ClassroomResponse, SubjectResponse, TeacherResponse } from "@/types";

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
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [rooms, setRooms] = useState<ClassroomResponse[]>([]);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const [subjectRes, teacherRes, roomRes] = await Promise.all([
          api.get<SubjectResponse[]>("/admin/subjects"),
          api.get<TeacherResponse[] | { items: TeacherResponse[] }>("/admin/users/teachers?page_size=1000"),
          api.get<ClassroomResponse[]>("/admin/classrooms"),
        ]);
        setSubjects(subjectRes.data);
        setTeachers(Array.isArray(teacherRes.data) ? teacherRes.data : teacherRes.data.items ?? []);
        setRooms(roomRes.data);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Could not load subjects, teachers and rooms"));
      }
    }
    void load();
  }, []);

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
