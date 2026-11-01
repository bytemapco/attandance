"use client";

import React, { useState } from "react";
import { Search, UserMinus, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassButton from "@/components/ui/GlassButton";
import GlassInput from "@/components/ui/GlassInput";
import GlassTable, { type TableColumn } from "@/components/ui/GlassTable";
import AddStudentsPanel from "./AddStudentsPanel";
import ReasonDialog from "./ReasonDialog";
import type { ClassDetail, ClassMemberItem } from "@/types";

type MemberRow = ClassMemberItem & Record<string, unknown>;

interface StudentsTabProps {
  cls: ClassDetail;
  onUpdated: (cls: ClassDetail) => void;
}

export default function StudentsTab({ cls, onUpdated }: StudentsTabProps): React.ReactElement {
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<ClassMemberItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = cls.members.filter(
    (m) => !needle || m.name.toLowerCase().includes(needle) || m.enrollment_number.toLowerCase().includes(needle)
  );

  async function removeMember(reason: string): Promise<void> {
    if (!removing) return;
    setSaving(true);
    try {
      const { data } = await api.post<ClassDetail>(
        `/admin/class-management/classes/${cls.id}/members/${removing.student_id}/remove`,
        { reason }
      );
      toast.success(`${removing.name} removed from ${cls.code}`);
      onUpdated(data);
      setRemoving(null);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not remove student"));
    } finally {
      setSaving(false);
    }
  }

  const columns: TableColumn<MemberRow>[] = [
    { key: "enrollment_number", header: "Enrollment No.", sortable: true },
    { key: "name", header: "Name", sortable: true },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <GlassButton variant="ghost" size="sm" icon={<UserMinus size={13} />} onClick={() => setRemoving(row)}>
          Remove
        </GlassButton>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:max-w-xs">
          <GlassInput
            aria-label="Search students"
            placeholder="Search name or enrollment no."
            icon={<Search size={14} />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <GlassButton variant="primary" icon={<UserPlus size={16} />} onClick={() => setAdding(true)}>
          Add students
        </GlassButton>
      </div>
      {adding && <AddStudentsPanel cls={cls} onUpdated={onUpdated} onClose={() => setAdding(false)} />}
      <GlassTable
        columns={columns}
        data={visible as MemberRow[]}
        emptyMessage={needle ? "No student matches your search." : "No students in this class yet."}
        rowKey={(row) => row.student_id}
        pageSize={20}
      />
      {removing && (
        <ReasonDialog
          title={`Remove ${removing.name} from ${cls.code}`}
          confirmLabel="Remove"
          loading={saving}
          onConfirm={(reason) => void removeMember(reason)}
          onCancel={() => setRemoving(null)}
        />
      )}
    </div>
  );
}
