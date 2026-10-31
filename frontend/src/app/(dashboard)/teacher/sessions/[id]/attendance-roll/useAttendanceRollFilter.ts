import { useMemo } from "react";
import type { SessionStudentAttendanceItem } from "@/types";
import type { AttendanceRollFilterStatus } from "./AttendanceRollSearchFilter";

interface UseAttendanceRollFilterProps {
  rollItems: SessionStudentAttendanceItem[];
  statusFilter: AttendanceRollFilterStatus;
  searchQuery: string;
}

export function useAttendanceRollFilter({
  rollItems,
  statusFilter,
  searchQuery,
}: UseAttendanceRollFilterProps) {
  const counts = useMemo(() => {
    const present = rollItems.filter((r) => r.status === "Present" || r.status === "Approved").length;
    const absent = rollItems.filter((r) => r.status === "Absent").length;
    const flagged = rollItems.filter((r) => r.status === "Flagged").length;
    return { all: rollItems.length, present, absent, flagged };
  }, [rollItems]);

  const filteredItems = useMemo(() => {
    return rollItems
      .filter((item) => {
        if (statusFilter === "Present") return item.status === "Present" || item.status === "Approved";
        if (statusFilter === "Absent") return item.status === "Absent";
        if (statusFilter === "Flagged") return item.status === "Flagged";
        return true;
      })
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.full_name.toLowerCase().includes(q) ||
          item.enrollment_number.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q)
        );
      })
      .map((item, idx) => ({ ...item, display_index: idx + 1 }));
  }, [rollItems, statusFilter, searchQuery]);

  return { counts, filteredItems };
}
