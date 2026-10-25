"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { Check, X, RefreshCw, Inbox } from "lucide-react";
import { superAdminService } from "@/services/superAdminService";
import { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassButton from "@/components/ui/GlassButton";
import GlassBadge from "@/components/ui/GlassBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LicenseRequestItem, LicenseRequestStatus } from "@/types/tenant";

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function statusVariant(status: LicenseRequestStatus): "success" | "danger" | "warning" | "info" {
  switch (status) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "danger";
    case "PENDING":
      return "warning";
    default:
      return "info";
  }
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LicenseRequestsPage(): React.JSX.Element {
  const [requests, setRequests] = useState<LicenseRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await superAdminService.getLicenseRequests({
        page,
        page_size: pageSize,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      setRequests(data.items);
      setTotal(data.total_items ?? 0);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load license requests"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  async function handleProcess(request: LicenseRequestItem, approve: boolean): Promise<void> {
    if (processingId) return;
    try {
      setProcessingId(request.id);
      await superAdminService.processLicenseRequest(request.id, approve);
      toast.success(
        approve
          ? `Approved ${request.requested_count} license(s) for ${request.tenant_name || "tenant"}.`
          : `Rejected license request for ${request.tenant_name || "tenant"}.`
      );
      await fetchRequests();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to process license request"));
    } finally {
      setProcessingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Dashboard", href: "/super-admin/dashboard" },
          { label: "License Requests" },
        ]}
      />

      <GlassPageHeader
        title="License Requests"
        actions={
          <GlassButton variant="ghost" onClick={() => void fetchRequests()} className="gap-2">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </GlassButton>
        }
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Filter by status
          </label>
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[150px] bg-card border-border text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">{total} request(s)</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <Inbox size={32} className="text-muted-foreground/50 mb-3" />
            <p className="text-sm font-semibold text-foreground">No license requests</p>
            <p className="text-xs text-muted-foreground mt-1">
              {statusFilter !== "ALL" ? "No requests match the selected status." : "Requests from tenant administrators will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3">Licenses</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requested</th>
                  <th className="px-4 py-3">Processed</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-foreground">{request.tenant_name || "Unknown tenant"}</p>
                      {request.tenant_slug && (
                        <p className="text-[11px] text-muted-foreground font-mono">{request.tenant_slug}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {request.requested_by_email || request.requested_by_name || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-foreground font-semibold">
                      +{request.requested_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <GlassBadge variant={statusVariant(request.status)}>{request.status}</GlassBadge>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{formatDate(request.created_at)}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {request.status === "PENDING"
                        ? "—"
                        : `${formatDate(request.processed_at)}${request.processed_by_email ? ` · ${request.processed_by_email}` : ""}`}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {request.status === "PENDING" ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            disabled={processingId === request.id}
                            onClick={() => void handleProcess(request, true)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                          >
                            <Check size={12} />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            disabled={processingId === request.id}
                            onClick={() => void handleProcess(request, false)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            <X size={12} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <GlassButton
              variant="ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </GlassButton>
            <GlassButton
              variant="ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </GlassButton>
          </div>
        </div>
      )}
    </div>
  );
}
