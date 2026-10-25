"use client";

import React from "react";
import { User, Activity, Clock, Eye, GraduationCap, UserPlus, FileSpreadsheet, Layers, Settings } from "lucide-react";
import GlassTable, { type TableColumn } from "@/components/ui/GlassTable";
import EnterprisePagination from "@/components/ui/EnterprisePagination";
import GlassBadge, { type BadgeVariant } from "@/components/ui/GlassBadge";
import type { AuditLogResponse } from "@/types";

const SEVERITY_VARIANT: Record<string, BadgeVariant> = {
  HIGH: "danger",
  CRITICAL: "danger",
  MEDIUM: "warning",
  LOW: "info",
  INFO: "info",
};

export function getEventIcon(rawName: string): React.ReactElement {
  const norm = rawName.toUpperCase();
  if (norm.includes("STUDENT") && norm.includes("ENROLL")) {
    return <GraduationCap size={14} className="text-indigo-600 dark:text-indigo-400" />;
  }
  if (norm.includes("STUDENT") || norm.includes("USER") || norm.includes("TEACHER")) {
    return <UserPlus size={14} className="text-emerald-600 dark:text-emerald-400" />;
  }
  if (norm.includes("IMPORT") || norm.includes("BULK")) {
    return <FileSpreadsheet size={14} className="text-sky-600 dark:text-sky-400" />;
  }
  if (norm.includes("CLASS")) {
    return <Layers size={14} className="text-purple-600 dark:text-purple-400" />;
  }
  if (norm.includes("CONFIG") || norm.includes("SETTING")) {
    return <Settings size={14} className="text-amber-600 dark:text-amber-400" />;
  }
  return <Activity size={14} className="text-slate-600 dark:text-slate-400" />;
}

export function formatEventName(rawName: string): string {
  if (!rawName) return "System Action";
  const knownMap: Record<string, string> = {
    CREATE_STUDENT: "Create Student",
    CREATESTUDENT: "Create Student",
    CREATE_TEACHER: "Create Teacher",
    CREATETEACHER: "Create Teacher",
    CREATE_CLASS: "Create Class",
    CREATECLASS: "Create Class",
    ENROLL_STUDENTS: "Enroll Students",
    ENROLLSTUDENTS: "Enroll Students",
    BULK_IMPORT_STUDENTS: "Bulk Import Students",
    BULKIMPORTSTUDENTS: "Bulk Import Students",
    LOGIN_ATTEMPT: "User Login",
    SYSTEM_EVENT: "System Event",
    AUTH_LOGIN: "Authentication",
    SCAN_COMPLETED: "AI Scan Completed",
    CONFIG_UPDATED: "Settings Updated",
  };
  const normalized = rawName.trim().toUpperCase().replace(/[\s_]+/g, "");
  if (knownMap[normalized]) return knownMap[normalized];

  const spaced = rawName.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").trim();
  return spaced.toLowerCase().split(" ").filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

interface ActivityLogTableProps {
  logs: (AuditLogResponse & Record<string, unknown>)[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (field: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onInspect: (record: AuditLogResponse & Record<string, unknown>) => void;
}

export default function ActivityLogTable({
  logs,
  loading,
  totalItems,
  currentPage,
  pageSize,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onInspect,
}: ActivityLogTableProps): React.ReactElement {
  const columns: TableColumn<AuditLogResponse & Record<string, unknown>>[] = [
    {
      key: "eventType",
      header: "Action / Event",
      sortable: true,
      render: (r) => {
        const rawEvent = String(r.eventType || r.action || "EVENT");
        return (
          <div className="flex items-center gap-2.5 py-0.5">
            <div className="p-1.5 rounded-lg bg-secondary/80 border border-border shrink-0">
              {getEventIcon(rawEvent)}
            </div>
            <span className="font-semibold text-xs text-foreground tracking-normal whitespace-nowrap">
              {formatEventName(rawEvent)}
            </span>
          </div>
        );
      },
    },
    {
      key: "description",
      header: "Activity Details",
      render: (r) => (
        <span className="text-xs text-muted-foreground block line-clamp-1 max-w-md">
          {String(r.description || "System activity logged")}
        </span>
      ),
    },
    {
      key: "actor",
      header: "Performed By",
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <User size={12} className="text-muted-foreground shrink-0" />
          <span className="text-xs text-foreground font-mono truncate max-w-[200px]">
            {String(r.actor || r.performedBy || "System")}
          </span>
        </div>
      ),
    },
    {
      key: "timestamp",
      header: "Date & Time",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
          <Clock size={12} className="text-muted-foreground shrink-0" />
          <span>
            {new Date(String(r.timestamp)).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      key: "severity",
      header: "Status",
      render: (r) => (
        <div className="flex items-center justify-between gap-2">
          <GlassBadge variant={SEVERITY_VARIANT[String(r.severity)] ?? "info"} className="text-[10px] font-semibold uppercase tracking-wider">
            {String(r.severity || "INFO")}
          </GlassBadge>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInspect(r);
            }}
            title="Inspect Event"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <Eye size={13} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
      <GlassTable
        columns={columns}
        data={logs}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={onSortChange}
        emptyMessage="No activity events recorded for this criteria"
      />
      <EnterprisePagination
        totalItems={totalItems}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        itemName="activity logs"
      />
    </div>
  );
}
