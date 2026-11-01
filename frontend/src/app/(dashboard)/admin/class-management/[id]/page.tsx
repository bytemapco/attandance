"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

import api, { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassErrorState from "@/components/ui/GlassErrorState";
import GlassLoader from "@/components/ui/GlassLoader";
import StudentsTab from "./StudentsTab";
import SubjectsTab from "./SubjectsTab";
import type { ClassDetail } from "@/types";

type TabKey = "students" | "subjects";

const TABS: { key: TabKey; label: string }[] = [
  { key: "students", label: "Students" },
  { key: "subjects", label: "Subjects & teachers" },
];

export default function ClassDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("students");

  const load = useCallback(async (): Promise<void> => {
    try {
      const { data } = await api.get<ClassDetail>(`/admin/class-management/classes/${id}`);
      setCls(data);
      setError(null);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Failed to load class");
      setError(message);
      toast.error(message);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <GlassErrorState message={error} onRetry={() => void load()} />;
  if (!cls) return <GlassLoader />;

  return (
    <div className="animate-fade-in-up space-y-4">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Classes", href: "/admin/class-management" },
          { label: cls.code },
        ]}
      />
      <GlassPageHeader
        title={`${cls.code} · Semester ${cls.semester_number}`}
        description={`${cls.department_name} · ${cls.academic_year_name} · ${cls.member_count} ${cls.member_count === 1 ? "student" : "students"} · ${cls.subject_count} ${cls.subject_count === 1 ? "subject" : "subjects"}`}
      />
      <div role="tablist" className="flex gap-1 border-b border-[#e3e1dc]">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-semibold transition-colors",
              tab === t.key ? "border-b-2 border-[#28363b] text-[#202b30]" : "text-[#526f78] hover:text-[#202b30]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "students" && <StudentsTab cls={cls} onUpdated={setCls} />}
      {tab === "subjects" && <SubjectsTab cls={cls} onUpdated={setCls} />}
    </div>
  );
}
