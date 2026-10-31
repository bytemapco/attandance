"use client";

import React from "react";
import { Check, X, Inbox } from "lucide-react";
import GlassBadge from "@/components/ui/GlassBadge";
import type { LicenseRequestItem, LicenseRequestStatus } from "@/types/tenant";

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
      <div className="bg-card border border-[#e3e1dc] rounded-2xl p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-[#eeece7]/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-card border border-[#e3e1dc] rounded-2xl p-10 flex flex-col items-center justify-center text-center">
        <Inbox size={32} className="text-[#526f78]/50 mb-3" />
        <p className="text-sm font-semibold text-[#28363b]">No license requests</p>
        <p className="text-xs text-[#526f78] mt-1">
          {statusFilter !== "ALL"
            ? "No requests match the selected status."
            : "Requests submitted by institution administrators will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-[#e3e1dc] rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(40,54,59,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#eeece7]/80 border-b border-[#e3e1dc] text-[11px] font-bold text-[#526f78] uppercase tracking-wider">
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
          <tbody className="divide-y divide-[#e3e1dc]">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-secondary/40 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-bold text-[#202b30] text-sm">{request.tenant_name || "Unknown tenant"}</p>
                </td>
                <td className="px-4 py-3.5 text-[#526f78]">
                  {request.requested_by_email || request.requested_by_name || "—"}
                </td>
                <td className="px-4 py-3.5 text-[#202b30] font-mono font-medium">
                  +{request.requested_count.toLocaleString()}
                </td>
                <td className="px-4 py-3.5">
                  <GlassBadge variant={statusVariant(request.status)}>
                    {request.status}
                  </GlassBadge>
                </td>
                <td className="px-4 py-3.5 text-[#526f78] text-[11px] font-mono">{formatDate(request.created_at)}</td>
                <td className="px-4 py-3.5 text-[#526f78] text-[11px]">
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#247653]/10 text-[#247653] hover:bg-[#247653]/20 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Check size={12} />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        disabled={processingId === request.id}
                        onClick={() => void onProcess(request, false)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#b54242]/10 text-[#b54242] hover:bg-[#b54242]/20 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <X size={12} />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#526f78]">Resolved</span>
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
