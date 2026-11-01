"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassButton from "@/components/ui/GlassButton";
import GlassSelect, { type SelectOption } from "@/components/ui/GlassSelect";
import type { ClassDetail, ClassSectionItem } from "@/types";

interface ChangeTeacherDialogProps {
  classId: string;
  section: ClassSectionItem;
  teacherOptions: SelectOption[];
  onUpdated: (cls: ClassDetail) => void;
  onClose: () => void;
}

export default function ChangeTeacherDialog({
  classId,
  section,
  teacherOptions,
  onUpdated,
  onClose,
}: ChangeTeacherDialogProps): React.ReactElement {
  const [teacherId, setTeacherId] = useState(section.teacher_id ?? "");
  const [saving, setSaving] = useState(false);

  async function save(): Promise<void> {
    setSaving(true);
    try {
      const { data } = await api.put<ClassDetail>(
        `/admin/class-management/classes/${classId}/sections/${section.id}`,
        { primary_teacher_id: teacherId }
      );
      toast.success(`Teacher updated for ${section.subject_name}`);
      onUpdated(data);
      onClose();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not change the teacher"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#28363b]/40 p-4 backdrop-blur-xs" onClick={onClose}>
      <div
        className="w-full max-w-md space-y-4 rounded-2xl border border-[#e3e1dc] bg-card p-6 shadow-[0_8px_24px_rgba(40,54,59,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-[#202b30]">
          {section.teacher_id ? "Change teacher" : "Assign teacher"} · {section.subject_name}
        </h3>
        <GlassSelect
          label="Teacher"
          placeholder="Select teacher"
          searchable
          value={teacherId}
          onChange={setTeacherId}
          options={teacherOptions}
        />
        <p className="text-xs text-[#526f78]">
          Upcoming classes move to the new teacher. Classes already held keep their original teacher.
        </p>
        <div className="flex justify-end gap-2 border-t border-[#e3e1dc] pt-3">
          <GlassButton variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            loading={saving}
            disabled={!teacherId || teacherId === section.teacher_id}
            onClick={() => void save()}
          >
            Save
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
