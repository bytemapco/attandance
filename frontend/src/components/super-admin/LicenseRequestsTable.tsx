"use client";

import React from "react";
import { Check, X, Inbox } from "lucide-react";
import Badge from "@/components/ui/Badge";
import type { LicenseRequestItem, LicenseRequestStatus } from "@/types/tenant";
import { Skeleton } from "@/components/ui/Skeleton";

interface LicenseRequestsTableProps {
  requests: LicenseRequestItem[];
  loading: boolean;
  statusFilter: string;
  processingId: string | null;
  onProcess: (request: LicenseRequestItem, approve: boolean) => Promise<void>;
}

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

export default function LicenseRequestsTable({
  requests,
  loading,
  statusFilter,
  processingId,
  onProcess,
}: LicenseRequestsTableProps): React.ReactElement {
  if (loading) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-4" role="status" aria-label="Loading license requests" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-10 flex flex-col items-center justify-center text-center">
        <Inbox size={32} className="text-muted-foreground/50 mb-3" />
        <p className="text-sm font-semibold text-primary">No license requests</p>
        <p className="text-xs text-muted-foreground mt-1">
          {statusFilter !== "ALL"
            ? "No requests match the selected status."
            : "Requests submitted by institution administrators will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary/80 border-b border-border text-xs font-semibold text-muted-foreground">
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
              <tr key={request.id} className="hover:bg-secondary/40 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-foreground text-sm">{request.tenant_name || "Unknown tenant"}</p>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">
                  {request.requested_by_email || request.requested_by_name || "—"}
                </td>
                <td className="px-4 py-3.5 text-foreground font-mono font-medium">
                  +{request.requested_count.toLocaleString()}
                </td>
                <td className="px-4 py-3.5">
                  <Badge variant={statusVariant(request.status)}>
                    {request.status}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground text-xs font-mono">{formatDate(request.created_at)}</td>
                <td className="px-4 py-3.5 text-muted-foreground text-xs">
                  {request.status === "PENDING"
                    ? "—"
                    : `${formatDate(request.processed_at)}${request.processed_by_email ? ` · ${request.processed_by_email}` : ""}`}
                </td>
                <td className="px-4 py-3.5 text-right">
                  {request.status === "PENDING" ? (
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={processingId === request.id}
                        onClick={() => void onProcess(request, true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Check size={12} />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        disabled={processingId === request.id}
                        onClick={() => void onProcess(request, false)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <X size={12} />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Resolved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
