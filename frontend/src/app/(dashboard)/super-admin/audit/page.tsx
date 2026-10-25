"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { superAdminService } from "@/services/superAdminService";
import { useDebounce } from "@/hooks/useDebounce";
import { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import EnterprisePagination from "@/components/ui/EnterprisePagination";
import AuditFilterBar from "@/components/super-admin/AuditFilterBar";
import AuditLogTable from "@/components/super-admin/AuditLogTable";
import AuditDetailModal from "@/components/super-admin/AuditDetailModal";
import type { SuperAdminAuditLog } from "@/types/tenant";

export default function SecurityAuditPage(): React.JSX.Element {
  const [logs, setLogs] = useState<SuperAdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [actorSearch, setActorSearch] = useState("");
  const debouncedActor = useDebounce(actorSearch, 350);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<SuperAdminAuditLog | null>(null);

  const fetchLogs = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await superAdminService.getAuditLogs({
        page,
        page_size: pageSize,
        actor: debouncedActor.trim() || undefined,
        severity: severityFilter !== "ALL" ? severityFilter : undefined,
        event_type: eventTypeFilter !== "ALL" ? eventTypeFilter : undefined,
      });
      setLogs(data.items);
      setTotal(data.total_items ?? 0);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to retrieve security audit logs"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedActor, severityFilter, eventTypeFilter]);

  const fetchEventTypes = useCallback(async (): Promise<void> => {
    try {
      const types = await superAdminService.getAuditEventTypes();
      setEventTypes(types);
    } catch {
      // Non-blocking fallback
    }
  }, []);

  useEffect(() => {
    void fetchEventTypes();
  }, [fetchEventTypes]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = (): void => {
    setActorSearch("");
    setSeverityFilter("ALL");
    setEventTypeFilter("ALL");
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Dashboard", href: "/super-admin/dashboard" },
          { label: "Audit Logs" },
        ]}
      />

      <GlassPageHeader
        title="Audit Logs"
      />

      <AuditFilterBar
        actorSearch={actorSearch}
        onActorSearchChange={(val) => {
          setActorSearch(val);
          setPage(1);
        }}
        severityFilter={severityFilter}
        onSeverityFilterChange={(val) => {
          setSeverityFilter(val);
          setPage(1);
        }}
        eventTypeFilter={eventTypeFilter}
        eventTypes={eventTypes}
        onEventTypeFilterChange={(val) => {
          setEventTypeFilter(val);
          setPage(1);
        }}
        onReset={handleResetFilters}
        onRefresh={() => void fetchLogs()}
      />

      <div>
        <AuditLogTable
          logs={logs}
          loading={loading}
          onSelectLog={(log) => setSelectedLog(log)}
        />

        {!loading && total > 0 && (
          <div className="mt-3 bg-card border border-border rounded-xl">
            <EnterprisePagination
              currentPage={page}
              totalItems={total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              itemName="audit events"
            />
          </div>
        )}
      </div>

      <AuditDetailModal
        log={selectedLog}
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
