"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Layers,
  Users,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import api, { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassErrorState from "@/components/ui/GlassErrorState";
import GlassLoader from "@/components/ui/GlassLoader";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassButton from "@/components/ui/GlassButton";
import ClassTimetable from "./ClassTimetable";
import StudentsTab from "./StudentsTab";
import type { ClassDetail } from "@/types";

type TabKey = "students" | "timetable";

const SEMESTER_NUMBERS = Array.from({ length: 8 }, (_, i) => i + 1);

export default function ClassDetailPage(): React.ReactElement {
  const router = useRouter();
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

  async function changeSemester(semesterNumber: number): Promise<void> {
    try {
      const { data } = await api.patch<ClassDetail>(`/admin/class-management/classes/${id}`, {
        semester_number: semesterNumber,
      });
      setCls(data);
      toast.success(`Semester changed to ${semesterNumber}`);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Could not change the semester"));
    }
  }

  if (error) return <GlassErrorState message={error} onRetry={() => void load()} />;
  if (!cls) return <GlassLoader />;

  const incompleteSubjects = cls.sections.filter((s) => !s.teacher_id || s.schedule.length === 0).length;
  const isNeedsSetup = (cls.subject_count || 0) === 0 || incompleteSubjects > 0;
  const setupMessage =
    cls.subject_count === 0
      ? "This class has no subjects yet."
      : `${incompleteSubjects} of ${cls.subject_count} subjects still need a teacher or class times. Teachers cannot see them in their timetable until then.`;

  return (
    <div className="space-y-5">
      {/* Breadcrumb Navigation */}
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Classes", href: "/admin/class-management" },
          { label: `${cls.code} (Sem ${cls.semester_number})` },
        ]}
      />

      {/* Main Header with Context Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/70">
        <div>
          <div className="flex items-center gap-3">
            <GlassButton
              variant="ghost"
              size="sm"
              icon={<ArrowLeft size={14} />}
              onClick={() => router.push("/admin/class-management")}
              className="text-xs -ml-2"
            >
              Classes
            </GlassButton>
            <span className="text-muted-foreground/50">|</span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {cls.code}
            </h1>
            <label htmlFor="class-semester" className="sr-only">Semester</label>
            <select
              id="class-semester"
              value={cls.semester_number}
              onChange={(event) => void changeSemester(Number(event.target.value))}
              className="cursor-pointer rounded-full border border-info-border bg-info-soft px-2 py-0.5 text-xs font-bold text-info focus-visible:outline-2 focus-visible:outline-muted-foreground"
            >
              {SEMESTER_NUMBERS.map((number) => (
                <option key={number} value={number}>Semester {number}</option>
              ))}
            </select>
            <GlassBadge variant={cls.status === "ACTIVE" ? "success" : "neutral"}>
              {cls.status}
            </GlassBadge>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Building2 size={13} className="text-muted-foreground" />
              {cls.department_name}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Layers size={13} className="text-muted-foreground/70" />
              Batch: <strong className="text-foreground">{cls.batch}</strong>
            </span>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-lg border border-border bg-card shadow-2xs text-center">
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 justify-center">
              <Users size={12} className="text-info" /> Students
            </div>
            <div className="text-lg font-bold text-foreground font-mono">{cls.member_count}</div>
          </div>
          <div className="px-3.5 py-1.5 rounded-lg border border-border bg-card shadow-2xs text-center">
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1 justify-center">
              <BookOpen size={12} className="text-success" /> Subjects
            </div>
            <div className="text-lg font-bold text-foreground font-mono">{cls.subject_count}</div>
          </div>
        </div>
      </div>

      {/* Helpful Setup Reminder Banner if 0 subjects */}
      {isNeedsSetup && (
        <div className="p-3.5 rounded-lg border border-warning-border bg-warning-soft text-xs text-warning flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-warning" />
            <span>{setupMessage}</span>
          </div>
          <button
            onClick={() => setTab("timetable")}
            className="px-2.5 py-1 rounded-lg bg-warning text-primary-foreground font-semibold text-xs shrink-0 hover:bg-warning transition-colors"
          >
            Open timetable
          </button>
        </div>
      )}

      {/* Styled Tab Bar with Count Indicators */}
      <div role="tablist" className="flex gap-2 border-b border-border/80 pb-0">
        <button
          role="tab"
          aria-selected={tab === "students"}
          onClick={() => setTab("students")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-[2px]",
            tab === "students"
              ? "border-primary text-foreground bg-card/60"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Users size={14} className={tab === "students" ? "text-info" : "text-muted-foreground"} />
          <span>Students</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-secondary text-secondary-foreground font-mono">
            {cls.member_count}
          </span>
        </button>

        <button
          role="tab"
          aria-selected={tab === "timetable"}
          onClick={() => setTab("timetable")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-[2px]",
            tab === "timetable"
              ? "border-primary text-foreground bg-card/60"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarDays size={14} className={tab === "timetable" ? "text-accent-strong" : "text-muted-foreground"} />
          <span>Timetable</span>
          <span className={cn(
            "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
            isNeedsSetup ? "bg-warning text-primary-foreground" : "bg-secondary text-secondary-foreground"
          )}>
            {cls.subject_count}
          </span>
        </button>
      </div>

      {/* Active Tab View */}
      {tab === "students" && <StudentsTab cls={cls} onUpdated={setCls} />}
      {tab === "timetable" && <ClassTimetable cls={cls} onUpdated={setCls} />}
    </div>
  );
}
