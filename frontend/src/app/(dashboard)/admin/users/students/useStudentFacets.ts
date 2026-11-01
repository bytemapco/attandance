"use client";

import { useMemo } from "react";
import type { StudentResponse, StudentFilterFacetsResponse } from "@/types";

interface UseStudentFacetsProps {
  facets: StudentFilterFacetsResponse;
  students: StudentResponse[];
}

export function useStudentFacets({ facets, students }: UseStudentFacetsProps) {
  const semesterOptions = useMemo(() => {
    const set = new Set<number>(facets.semesters);
    students.forEach((s) => {
      if (s.semester && s.semester > 0) set.add(s.semester);
    });
    const list = Array.from(set).sort((a, b) => a - b);
    if (list.length === 0) {
      return Array.from({ length: 8 }, (_, i) => ({
        value: String(i + 1),
        label: `Semester ${i + 1}`,
      }));
    }
    return list.map((s) => ({ value: String(s), label: `Semester ${s}` }));
  }, [facets.semesters, students]);

  return { semesterOptions };
}
