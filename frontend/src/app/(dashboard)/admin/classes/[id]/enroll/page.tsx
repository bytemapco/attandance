"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api, { getApiErrorMessage } from "@/lib/api";
import GlassCard from "@/components/ui/GlassCard";
import GlassLoader from "@/components/ui/GlassLoader";
import { useDebounce } from "@/hooks/useDebounce";
import EnrollStudentRow from "./EnrollStudentRow";
import EnrollStudentFilters from "./EnrollStudentFilters";
import EnrollHeader from "./EnrollHeader";
import type { StudentResponse, ClassResponse, DepartmentResponse } from "@/types";

export default function EnrollStudentsPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  
  const [cls, setCls] = useState<ClassResponse | null>(null);
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    async function fetchData(): Promise<void> {
      try {
        const [clsRes, studentRes, deptRes] = await Promise.allSettled([
          api.get<ClassResponse>(`/admin/classes/${id}`),
          api.get<StudentResponse[] | { items: StudentResponse[] }>(
            "/admin/users/students?page_size=1000&sort_by=created_at&sort_order=desc"
          ),
          api.get<DepartmentResponse[]>("/admin/departments"),
        ]);

        if (clsRes.status === "fulfilled") {
          setCls(clsRes.value.data);
        } else {
          const fallback = await api.get<ClassResponse[] | { items: ClassResponse[] }>("/admin/classes");
          const list = Array.isArray(fallback.data) ? fallback.data : fallback.data.items || [];
          setCls(list.find((c) => c.id === id) || null);
        }

        if (studentRes.status === "fulfilled") {
          const data = studentRes.value.data;
          setStudents(Array.isArray(data) ? data : data.items || []);
        }
        if (deptRes.status === "fulfilled") {
          setDepartments(Array.isArray(deptRes.value.data) ? deptRes.value.data : []);
        }
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, [id]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedDepartment && s.department_name !== selectedDepartment) return false;
      if (selectedSemester && String(s.semester) !== selectedSemester) return false;
      if (selectedBatch && s.batch !== selectedBatch) return false;
      if (debouncedSearch.trim()) {
        const lowerQ = debouncedSearch.toLowerCase();
        const nameMatch = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase().includes(lowerQ);
        const emailMatch = s.email.toLowerCase().includes(lowerQ);
        const enrollMatch = (s.enrollment_number || "").toLowerCase().includes(lowerQ);
        const deptMatch = (s.department_name || "").toLowerCase().includes(lowerQ);
        if (!nameMatch && !emailMatch && !enrollMatch && !deptMatch) return false;
      }
      return true;
    });
  }, [students, debouncedSearch, selectedDepartment, selectedSemester, selectedBatch]);

  const nonEnrolledFilteredStudents = useMemo(() => {
    return filteredStudents.filter((s) => !(cls?.enrolled_student_ids?.includes(s.id) ?? false));
  }, [filteredStudents, cls]);

  const allVisibleSelected = nonEnrolledFilteredStudents.length > 0 && 
    nonEnrolledFilteredStudents.every((s) => selectedIds.has(s.id));

  const filterOptions = useMemo(() => {
    const deptSet = new Set<string>(departments.map((d) => d.name));
    const semesters = new Set<string>(["1", "2", "3", "4", "5", "6", "7", "8"]);
    const batches = new Set<string>();
    for (const s of students) {
      if (s.department_name) deptSet.add(s.department_name);
      if (s.semester) semesters.add(String(s.semester));
      if (s.batch) batches.add(s.batch);
    }
    return {
      uniqueDepartments: Array.from(deptSet).filter(Boolean).sort(),
      uniqueSemesters: Array.from(semesters).sort((a, b) => Number(a) - Number(b)),
      uniqueBatches: Array.from(batches).filter(Boolean).sort(),
    };
  }, [students, departments]);

  const toggleSelect = (studentId: string) => {
    if (cls?.enrolled_student_ids?.includes(studentId)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      nonEnrolledFilteredStudents.forEach((s) => allVisibleSelected ? next.delete(s.id) : next.add(s.id));
      return next;
    });
  };

  async function handleEnroll(): Promise<void> {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one student");
      return;
    }
    setEnrolling(true);
    try {
      const { data } = await api.post<{ enrolled_count: number; message?: string }>(`/admin/classes/${id}/enroll`, { 
        student_ids: Array.from(selectedIds) 
      });
      if (data.enrolled_count > 0) {
        toast.success(`${data.enrolled_count} student(s) enrolled successfully`);
      } else {
        toast(data.message || "Selected student(s) are already enrolled", { icon: "ℹ️" });
      }
      router.push(`/admin/classes/${id}`);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Enrollment failed"));
    } finally { 
      setEnrolling(false); 
    }
  }

  if (loading) return <GlassLoader text="Loading students directory..." />;
  if (!cls) return <div className="text-center py-20 text-muted-foreground text-xs">Class not found</div>;

  return (
    <div className="space-y-6">
      <EnrollHeader
        cls={cls}
        selectedCount={selectedIds.size}
        enrolling={enrolling}
        onEnroll={() => void handleEnroll()}
      />

      <GlassCard padding="none" className="overflow-hidden bg-card">
        <EnrollStudentFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
          selectedSemester={selectedSemester}
          setSelectedSemester={setSelectedSemester}
          selectedBatch={selectedBatch}
          setSelectedBatch={setSelectedBatch}
          filterOptions={filterOptions}
          allVisibleSelected={allVisibleSelected}
          onToggleSelectAll={toggleSelectAll}
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          hasNonEnrolledVisible={nonEnrolledFilteredStudents.length > 0}
        />

        <div className="max-h-[560px] overflow-y-auto p-3 space-y-2">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No students found matching your search filter.
            </div>
          ) : (
            filteredStudents.map((student) => (
              <EnrollStudentRow
                key={student.id}
                student={student}
                isSelected={selectedIds.has(student.id)}
                isAlreadyEnrolled={cls?.enrolled_student_ids?.includes(student.id) || false}
                onToggle={() => toggleSelect(student.id)}
              />
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}
