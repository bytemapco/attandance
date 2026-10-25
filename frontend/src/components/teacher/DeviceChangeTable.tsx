"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle2, XCircle, Smartphone, AlertCircle, Loader2, Search, X } from "lucide-react";
import GlassTable, { TableColumn } from "@/components/ui/GlassTable";
import EnterprisePagination from "@/components/ui/EnterprisePagination";
import { useDebounce } from "@/hooks/useDebounce";
import api, { getApiErrorMessage } from "@/lib/api";
import { toast } from "react-hot-toast";
import type { DeviceChangeRequest } from "@/types/models";

interface DeviceChangeTableProps {
  requests: DeviceChangeRequest[];
  onActionComplete: () => void;
}

export default function DeviceChangeTable({ requests, onActionComplete }: DeviceChangeTableProps): React.JSX.Element {
  const [localRequests, setLocalRequests] = useState<DeviceChangeRequest[]>(requests);
  const [processing, setProcessing] = useState<{ id: string; action: "APPROVED" | "REJECTED" } | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setLocalRequests(requests);
  }, [requests]);

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED"): Promise<void> => {
    try {
      setProcessing({ id, action: status });
      await api.put(`/teacher/device-changes/${id}/approve`, { status });
      toast.success(`Request ${status.toLowerCase()} successfully`);
      setLocalRequests((prev) => prev.filter((r) => r.id !== id));
      onActionComplete();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Action failed"));
    } finally {
      setProcessing(null);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!debouncedSearch.trim()) return localRequests;
    const q = debouncedSearch.toLowerCase();
    return localRequests.filter(
      (r) =>
        r.student_name.toLowerCase().includes(q) ||
        r.enrollment_number.toLowerCase().includes(q) ||
        (r.reason && r.reason.toLowerCase().includes(q))
    );
  }, [localRequests, debouncedSearch]);

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, page, pageSize]);

  const columns: TableColumn<DeviceChangeRequest & Record<string, unknown>>[] = [
    {
      key: "student",
      header: "Student Details",
      render: (req) => (
        <div>
          <p className="text-sm font-semibold text-foreground">{req.student_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{req.enrollment_number}</p>
        </div>
      ),
    },
    {
      key: "request",
      header: "Request Info",
      render: (req) => (
        <div>
          <div className="flex items-center gap-1.5">
            <Smartphone size={14} className="text-muted-foreground" />
            <span className="text-xs font-mono text-foreground">{req.new_device_uuid.substring(0, 8)}...</span>
          </div>
          {req.reason && (
            <div className="flex items-center gap-1 mt-1 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 w-fit px-2 py-0.5 rounded">
              <AlertCircle size={10} />
              <span className="truncate max-w-[200px]">{req.reason}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "date",
      header: "Date Submitted",
      render: (req) => <div className="text-xs text-muted-foreground">{formatDate(req.created_at)}</div>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (req) => {
        const isProcessing = processing?.id === req.id;
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void handleAction(req.id, "REJECTED")}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-95 disabled:opacity-50 transition-all text-xs font-medium cursor-pointer"
            >
              {isProcessing && processing?.action === "REJECTED" ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
              <span>Reject</span>
            </button>
            <button
              type="button"
              onClick={() => void handleAction(req.id, "APPROVED")}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all text-xs font-medium cursor-pointer"
            >
              {isProcessing && processing?.action === "APPROVED" ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              <span>Approve</span>
            </button>
          </div>
        );
      },
    },
  ];

  if (localRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-border rounded-xl bg-card">
        <div className="w-12 h-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-3">
          <Smartphone size={24} />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">No Pending Requests</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          All device change requests have been processed. Students can request device changes from their mobile app.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Filter requests by name, enrollment..."
          className="w-full pl-8 pr-8 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {search && (
          <button type="button" onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={13} />
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        <GlassTable
          columns={columns}
          data={paginatedRequests as (DeviceChangeRequest & Record<string, unknown>)[]}
          rowKey={(req) => req.id}
          emptyMessage="No device requests match your search."
        />
        {filteredRequests.length > 0 && (
          <EnterprisePagination
            totalItems={filteredRequests.length}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
            itemName="requests"
          />
        )}
      </div>
    </div>
  );
}
