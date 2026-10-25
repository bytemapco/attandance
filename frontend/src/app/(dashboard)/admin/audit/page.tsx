"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import ActivityFilterBar, { type ActivityCategory } from "@/components/admin/ActivityFilterBar";
import ActivityLogTable from "@/components/admin/ActivityLogTable";
import { useAuditTableQuery } from "@/hooks/useAuditTableQuery";
import type { AuditLogResponse } from "@/types";

export default function AuditPage(): React.ReactElement {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>("ALL");

  const {
    data: logs,
    totalItems,
    loading,
    searchQuery,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    filterValue,
    timePreset,
    startDate,
    endDate,
    setSearchQuery,
    setCurrentPage,
    setPageSize,
    handleSort,
    setFilterValue,
    refetch,
    handleTimePresetChange,
    handleDateRangeChange,
    handleResetTimeFilter,
  } = useAuditTableQuery();

  const filteredLogs = useMemo(() => {
    const rawList = logs as (AuditLogResponse & Record<string, unknown>)[];
    if (selectedCategory === "ALL") return rawList;
    return rawList.filter((item) => {
      const type = String(item.eventType || item.action || "").toUpperCase();
      if (selectedCategory === "USERS") return type.includes("STUDENT") || type.includes("TEACHER") || type.includes("USER");
      if (selectedCategory === "CLASSES") return type.includes("CLASS") || type.includes("ENROLL");
      if (selectedCategory === "SECURITY") return type.includes("AUTH") || type.includes("LOGIN") || type.includes("SCAN");
      if (selectedCategory === "CONFIG") return type.includes("CONFIG") || type.includes("SETTING");
      return true;
    });
  }, [logs, selectedCategory]);

  const handleExportCSV = async (): Promise<void> => {
    try {
      setExporting(true);
      const res = await api.get("/admin/audit/export", { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `system-activity-logs-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Activity log CSV exported successfully");
    } catch {
      toast.error("Failed to export log");
    } finally {
      setExporting(false);
    }
  };

  const openInspector = (record: AuditLogResponse & Record<string, unknown>) => {
    router.push(`/admin/audit/${record.id}`);
  };

  return (
    <div className="space-y-5">
      <GlassBreadcrumb items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Activity Logs" }]} />
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <GlassPageHeader
          title="Activity Log"
        />
        <button
          onClick={() => void handleExportCSV()}
          disabled={exporting}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-secondary hover:text-foreground transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <Download size={13} className={exporting ? "animate-bounce text-primary" : "text-muted-foreground"} />
          <span>{exporting ? "Exporting..." : "Export CSV"}</span>
        </button>
      </div>

      {/* Enterprise Multi-Category, Search, Severity & Calendar Time Toolbar */}
      <ActivityFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedSeverity={filterValue}
        onSeverityChange={setFilterValue}
        onRefresh={() => void refetch()}
        isRefreshing={loading}
        selectedTimePreset={timePreset}
        onTimePresetChange={handleTimePresetChange}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
        onResetTimeFilter={handleResetTimeFilter}
      />

      {/* Main Clean Table */}
      <ActivityLogTable
        logs={filteredLogs}
        loading={loading}
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSort}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onInspect={openInspector}
      />
    </div>
  );
}
