"use client";

import { useMemo } from "react";
import type { StudentResponse, StudentFilterFacetsResponse } from "@/types";

interface UseStudentFacetsProps {
  facets: StudentFilterFacetsResponse;
  students: StudentResponse[];
}

export function useStudentFacets({ facets, students }: UseStudentFacetsProps) {
  const branchOptions = useMemo(() => {
    const set = new Set<string>(facets.branches);
    students.forEach((s) => {
      if (s.branch && s.branch.trim()) set.add(s.branch.trim());
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .map((b) => ({ value: b, label: b }));
  }, [facets.branches, students]);

  const batchOptions = useMemo(() => {
    const set = new Set<string>(facets.batches);
    students.forEach((s) => {
      if (s.batch && s.batch.trim()) set.add(s.batch.trim());
    });
    return Array.from(set)
      .sort((a, b) => b.localeCompare(a))
      .map((b) => ({ value: b, label: b }));
  }, [facets.batches, students]);

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

  return { branchOptions, batchOptions, semesterOptions };
}
