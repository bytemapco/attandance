"use client";

import { useState, useMemo } from "react";
import { type TimeRangePreset } from "@/components/admin/TimePresetFilter";
import { useTableQuery } from "@/hooks/useTableQuery";
import type { AuditLogResponse } from "@/types";

export function useAuditTableQuery() {
  const [timePreset, setTimePreset] = useState<TimeRangePreset>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { queryStart, queryEnd } = useMemo(() => {
    // If explicit calendar date range is selected, prioritize it
    if (startDate || endDate) {
      return {
        queryStart: startDate ? new Date(startDate).toISOString() : undefined,
        queryEnd: endDate ? new Date(`${endDate}T23:59:59.999Z`).toISOString() : undefined,
      };
    }

    if (timePreset === "ALL") return { queryStart: undefined, queryEnd: undefined };

    const now = new Date();
    if (timePreset === "15M") {
      const start = new Date(now.getTime() - 15 * 60 * 1000);
      return { queryStart: start.toISOString(), queryEnd: now.toISOString() };
    }
    if (timePreset === "1H") {
      const start = new Date(now.getTime() - 60 * 60 * 1000);
      return { queryStart: start.toISOString(), queryEnd: now.toISOString() };
    }
    if (timePreset === "6H") {
      const start = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      return { queryStart: start.toISOString(), queryEnd: now.toISOString() };
    }
    if (timePreset === "24H") {
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return { queryStart: start.toISOString(), queryEnd: now.toISOString() };
    }
    return { queryStart: undefined, queryEnd: undefined };
  }, [timePreset, startDate, endDate]);

  const extraParams = useMemo(() => {
    return {
      start_date: queryStart,
      end_date: queryEnd,
    };
  }, [queryStart, queryEnd]);

  const table = useTableQuery<AuditLogResponse>({
    endpoint: "/admin/audit",
    defaultPageSize: 15,
    defaultSortBy: "timestamp",
    defaultSortOrder: "desc",
    filterKey: "severity",
    extraParams,
  });

  const { refetch, setCurrentPage } = table;

  const handleTimePresetChange = (preset: TimeRangePreset) => {
    setTimePreset(preset);
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setTimePreset("CUSTOM");
    setCurrentPage(1);
  };

  const handleResetTimeFilter = () => {
    setTimePreset("ALL");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  return {
    ...table,
    timePreset,
    startDate,
    endDate,
    refetch,
    handleTimePresetChange,
    handleDateRangeChange,
    handleResetTimeFilter,
  };
}
