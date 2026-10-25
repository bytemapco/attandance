"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassLoader from "@/components/ui/GlassLoader";
import { useDebounce } from "@/hooks/useDebounce";
import ManualAttendanceStats from "./ManualAttendanceStats";
import ManualAttendanceStudentRow from "./ManualAttendanceStudentRow";
import type { SessionAttendanceResponse, BulkMarkRequest } from "@/types";

type AttendanceStatus = "Present" | "Absent";

export default function ManualAttendancePage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [roster, setRoster] = useState<SessionAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusMap, setStatusMap] = useState<Map<string, AttendanceStatus>>(new Map());
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const { data } = await api.get<SessionAttendanceResponse>(`/teacher/sessions/${id}/attendance`);
        if (isMounted) {
          setRoster(data);
          const initMap = new Map<string, AttendanceStatus>();
          data.roster.forEach((s) => {
            const isPresent = s.status === "Present" || s.status === "Flagged" || s.status === "Approved";
            initMap.set(s.student_id, isPresent ? "Present" : "Absent");
          });
          setStatusMap(initMap);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          toast.error(getApiErrorMessage(err, "Could not load session roster"));
          setLoading(false);
        }
      }
    };
    void load();
    return () => { isMounted = false; };
  }, [id]);

  const toggleStatus = useCallback((studentId: string): void => {
    setStatusMap((prev) => {
      const next = new Map(prev);
      const current = prev.get(studentId) ?? "Absent";
      next.set(studentId, current === "Present" ? "Absent" : "Present");
      return next;
    });
  }, []);

  function handleMarkAll(status: AttendanceStatus): void {
    if (!roster) return;
    setStatusMap((prev) => {
      const next = new Map(prev);
      roster.roster.forEach((s) => next.set(s.student_id, status));
      return next;
    });
    toast.success(`Marked all students as ${status}`);
  }

  function handleReset(): void {
    if (!roster) return;
    const next = new Map<string, AttendanceStatus>();
    roster.roster.forEach((s) => {
      const isPresent = s.status === "Present" || s.status === "Flagged" || s.status === "Approved";
      next.set(s.student_id, isPresent ? "Present" : "Absent");
    });
    setStatusMap(next);
    toast("Reset to original attendance status", { icon: "🔄" });
  }

  async function handleSubmit(): Promise<void> {
    if (statusMap.size === 0) {
      toast.error("No students enrolled in this session to mark attendance");
      return;
    }
    setSubmitting(true);
    try {
      const records = Array.from(statusMap.entries()).map(([student_id, status]) => ({ student_id, status }));
      await api.post(`/teacher/sessions/${id}/mark-bulk`, { records } as BulkMarkRequest);
      toast.success("Attendance override applied successfully");
      router.push(`/teacher/sessions/${id}/roster`);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to submit attendance"));
    } finally {
      setSubmitting(false);
    }
  }

  const totalCount = roster ? roster.roster.length : 0;
  const presentCount = Array.from(statusMap.values()).filter((s) => s === "Present").length;
  const absentCount = totalCount - presentCount;
  const presentPercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const filteredStudents = useMemo(() => {
    if (!roster) return [];
    if (!debouncedSearch.trim()) return roster.roster;
    const q = debouncedSearch.toLowerCase();
    return roster.roster.filter((s) => {
      const name = (s.full_name || (s as { student_name?: string }).student_name || "").toLowerCase();
      const enroll = (s.enrollment_number || "").toLowerCase();
      return name.includes(q) || enroll.includes(q);
    });
  }, [roster, debouncedSearch]);

  if (loading) return <GlassLoader text="Loading session roster..." />;
  if (!roster) return <div className="text-center py-20 text-muted-foreground font-medium">Session not found</div>;

  return (
    <div className="space-y-4">
      <GlassBreadcrumb items={[{ label: "Sessions", href: "/teacher/sessions" }, { label: roster.class_name, href: `/teacher/sessions/${id}/roster` }, { label: "Manual Entry" }]} />
      <GlassPageHeader
        title={`Manual Override — ${roster.class_name}`}
        description="Fast, keyboard-driven attendance roster management."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start mt-2">
        <ManualAttendanceStats
          presentPercent={presentPercent}
          presentCount={presentCount}
          absentCount={absentCount}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onMarkAll={handleMarkAll}
          onReset={handleReset}
          onSubmit={() => void handleSubmit()}
          onCancel={() => router.push(`/teacher/sessions/${id}/roster`)}
          submitting={submitting}
        />

        <div className="lg:col-span-2">
          <GlassCard padding="none" className="overflow-hidden bg-card">
            <div className="p-3.5 border-b border-border bg-secondary/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Students ({filteredStudents.length} listed)
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
                Click any row to toggle status
              </span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-2 text-center">
                <AlertCircle size={36} className="text-muted-foreground" />
                <h4 className="text-sm font-semibold text-foreground">No students match search</h4>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Adjust your search filter to display students.
                </p>
              </div>
            ) : (
              <div className="max-h-[580px] overflow-y-auto divide-y divide-border">
                {filteredStudents.map((student, idx) => {
                  const currentStatus = statusMap.get(student.student_id) ?? "Absent";
                  return (
                    <ManualAttendanceStudentRow
                      key={student.student_id}
                      student={student}
                      isPresent={currentStatus === "Present"}
                      isFocused={idx === focusedIndex}
                      onClick={() => {
                        setFocusedIndex(idx);
                        toggleStatus(student.student_id);
                      }}
                      innerRef={(el) => {
                        if (el) itemRefs.current.set(student.student_id, el);
                        else itemRefs.current.delete(student.student_id);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
