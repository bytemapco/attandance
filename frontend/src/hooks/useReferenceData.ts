"use client";

import useSWR from "swr";
import type {
  BatchResponse,
  ClassroomResponse,
  DepartmentResponse,
  DesignationResponse,
  SubjectResponse,
} from "@/types";
import type { SystemConfig } from "@/types/systemConfig";

const NONE: never[] = [];

interface ListRead<T> {
  items: T[];
  loading: boolean;
  failed: boolean;
}

/**
 * Reads a list that changes rarely and is needed on many pages (departments, designations, ...). All pages share
 * one cached copy; a successful write to the same part of the API refreshes it.
 */
function useList<T>(url: string): ListRead<T> {
  const { data, error, isLoading } = useSWR<T[]>(url);
  return { items: data ?? (NONE as T[]), loading: isLoading, failed: Boolean(error) };
}

export const useDepartments = (): ListRead<DepartmentResponse> => useList<DepartmentResponse>("/admin/departments");
export const useDesignations = (): ListRead<DesignationResponse> => useList<DesignationResponse>("/admin/designations");
export const useBatches = (): ListRead<BatchResponse> => useList<BatchResponse>("/admin/batches");
export const useSubjects = (): ListRead<SubjectResponse> => useList<SubjectResponse>("/admin/subjects");
export const useClassrooms = (): ListRead<ClassroomResponse> => useList<ClassroomResponse>("/admin/classrooms");

export function useSystemConfig() {
  return useSWR<SystemConfig>("/admin/config");
}
