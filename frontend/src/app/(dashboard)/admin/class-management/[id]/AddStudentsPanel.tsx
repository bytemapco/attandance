"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import GlassSearch from "@/components/ui/GlassSearch";
import type { ClassDetail, StudentResponse } from "@/types";

interface AddStudentsPanelProps {
  cls: ClassDetail;
  onUpdated: (cls: ClassDetail) => void;
  onClose: () => void;
}

function displayName(student: StudentResponse): string {
  return `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || student.email;
}

export default function AddStudentsPanel({ cls, onUpdated, onClose }: AddStudentsPanelProps): React.ReactElement {
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const { data } = await api.get<StudentResponse[] | { items: StudentResponse[] }>(
          "/admin/users/students?page_size=1000"
        );
        setStudents(Array.isArray(data) ? data : data.items ?? []);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load students"));
      }
    }
    void load();
  }, []);

  const candidates = useMemo(() => {
    const inClass = new Set(cls.members.map((m) => m.student_id));
    const needle = search.trim().toLowerCase();
    return students.filter((s) => {
      if (s.department_id !== cls.department_id || inClass.has(s.id)) return false;
      return !needle || `${displayName(s)} ${s.enrollment_number}`.toLowerCase().includes(needle);
    });
  }, [students, cls, search]);

  function toggle(studentId: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  async function addSelected(): Promise<void> {
    setSaving(true);
    try {
      const { data } = await api.post<ClassDetail>(`/admin/class-management/classes/${cls.id}/members`, {
        student_ids: Array.from(selected),
      });
      toast.success(`${selected.size} student(s) added`);
      onUpdated(data);
      onClose();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not add students"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassCard className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#202b30]">
          Add students from {cls.department_name}
        </h3>
        <GlassButton variant="ghost" size="sm" onClick={onClose}>
          Close
        </GlassButton>
      </div>
      <GlassSearch placeholder="Search by name or enrollment number" onSearch={setSearch} />
      <ul className="max-h-72 divide-y divide-[#e3e1dc] overflow-y-auto rounded-lg border border-[#e3e1dc]">
        {candidates.length === 0 && <li className="p-4 text-center text-xs text-[#526f78]">No students available to add.</li>}
        {candidates.map((s) => (
          <li key={s.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-secondary">
              <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
              <span className="font-medium">{displayName(s)}</span>
              <span className="text-xs text-[#526f78]">{s.enrollment_number}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex justify-end">
        <GlassButton variant="primary" disabled={selected.size === 0} loading={saving} onClick={() => void addSelected()}>
          Add {selected.size || ""} selected
        </GlassButton>
      </div>
    </GlassCard>
  );
}
