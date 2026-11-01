"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import GlassConfirmDialog from "@/components/ui/GlassConfirmDialog";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassTable, { type TableColumn } from "@/components/ui/GlassTable";
import ChangeTeacherDialog from "./ChangeTeacherDialog";
import SectionActions from "./SectionActions";
import ScheduleDialog, { WEEKDAYS } from "./ScheduleDialog";
import type { ClassDetail, ClassSectionItem, SubjectResponse, TeacherResponse } from "@/types";

type SectionRow = ClassSectionItem & Record<string, unknown>;

interface SubjectsTabProps {
  cls: ClassDetail;
  onUpdated: (cls: ClassDetail) => void;
}

export default function SubjectsTab({ cls, onUpdated }: SubjectsTabProps): React.ReactElement {
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ClassSectionItem | null>(null);
  const [scheduling, setScheduling] = useState<ClassSectionItem | null>(null);
  const [removing, setRemoving] = useState<ClassSectionItem | null>(null);
  const [removingBusy, setRemovingBusy] = useState(false);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const [subjectRes, teacherRes] = await Promise.all([
          api.get<SubjectResponse[]>("/admin/subjects"),
          api.get<TeacherResponse[] | { items: TeacherResponse[] }>("/admin/users/teachers?page_size=1000"),
        ]);
        setSubjects(subjectRes.data);
        setTeachers(Array.isArray(teacherRes.data) ? teacherRes.data : teacherRes.data.items ?? []);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load subjects and teachers"));
      }
    }
    void load();
  }, []);

  const subjectOptions = useMemo(() => {
    const added = new Set(cls.sections.map((s) => s.subject_id));
    return subjects
      .filter((s) => !added.has(s.id) && (!s.department_id || s.department_id === cls.department_id))
      .map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }));
  }, [subjects, cls.sections, cls.department_id]);

  const teacherOptions = useMemo(
    () =>
      teachers.map((t) => ({
        value: t.id,
        label: `${t.first_name} ${t.last_name}`.trim() + (t.department ? ` · ${t.department}` : ""),
      })),
    [teachers]
  );

  async function addSubject(): Promise<void> {
    setAdding(true);
    try {
      const { data } = await api.post<ClassDetail>(`/admin/class-management/classes/${cls.id}/sections`, {
        subject_id: subjectId,
        primary_teacher_id: teacherId || undefined,
      });
      toast.success("Subject added to the class");
      onUpdated(data);
      setSubjectId("");
      setTeacherId("");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not add the subject"));
    } finally {
      setAdding(false);
    }
  }

  async function removeSubject(): Promise<void> {
    if (!removing) return;
    setRemovingBusy(true);
    try {
      const { data } = await api.delete<ClassDetail>(
        `/admin/class-management/classes/${cls.id}/sections/${removing.id}`
      );
      toast.success(`${removing.subject_name} removed from the class`);
      onUpdated(data);
      setRemoving(null);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not remove the subject"));
    } finally {
      setRemovingBusy(false);
    }
  }

  const columns: TableColumn<SectionRow>[] = [
    {
      key: "subject_name",
      header: "Subject",
      render: (row) => (
        <span>
          <span className="font-semibold">{row.subject_name}</span>{" "}
          <span className="text-xs text-[#526f78]">{row.subject_code}</span>
        </span>
      ),
    },
    { key: "teacher_name", header: "Teacher", render: (row) => row.teacher_name ?? "Unassigned" },
    { key: "enrolled_count", header: "Students" },
    {
      key: "schedule",
      header: "Schedule",
      render: (row) =>
        row.schedule.length === 0 ? (
          <span className="text-xs text-[#b54242]">Not scheduled</span>
        ) : (
          <span className="text-xs">
            {row.schedule.map((r) => `${WEEKDAYS[r.day_of_week - 1]} ${r.start_time}`).join(", ")}
          </span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <SectionActions
          section={row}
          onSchedule={() => setScheduling(row)}
          onChangeTeacher={() => setEditing(row)}
          onRemove={() => setRemoving(row)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <GlassCard className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
        <GlassSelect
          label="Subject"
          placeholder={subjectOptions.length ? "Select subject" : "No more subjects available"}
          searchable
          value={subjectId}
          onChange={setSubjectId}
          options={subjectOptions}
        />
        <GlassSelect
          label="Teacher (optional)"
          placeholder="Select teacher"
          searchable
          value={teacherId}
          onChange={setTeacherId}
          options={[{ value: "", label: "Assign later" }, ...teacherOptions]}
        />
        <GlassButton variant="primary" disabled={!subjectId} loading={adding} onClick={() => void addSubject()}>
          Add Subject
        </GlassButton>
      </GlassCard>
      <GlassTable
        columns={columns}
        data={cls.sections as SectionRow[]}
        emptyMessage="No subjects added yet. Add a subject to enrol this class and assign a teacher."
        rowKey={(row) => row.id}
      />
      {editing && (
        <ChangeTeacherDialog
          classId={cls.id}
          section={editing}
          teacherOptions={teacherOptions}
          onUpdated={onUpdated}
          onClose={() => setEditing(null)}
        />
      )}
      {scheduling && (
        <ScheduleDialog
          classId={cls.id}
          section={cls.sections.find((s) => s.id === scheduling.id) ?? scheduling}
          onUpdated={onUpdated}
          onClose={() => setScheduling(null)}
        />
      )}
      <GlassConfirmDialog
        isOpen={removing !== null}
        title="Remove subject"
        message={`Remove ${removing?.subject_name ?? "this subject"} from ${cls.code}? Its timetable entries are deleted too. This is blocked once attendance has been recorded.`}
        confirmLabel="Remove"
        loading={removingBusy}
        onConfirm={() => void removeSubject()}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
