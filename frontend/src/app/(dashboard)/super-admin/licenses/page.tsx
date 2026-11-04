"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { RefreshCw } from "lucide-react";
import { superAdminService } from "@/services/superAdminService";
import { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassButton from "@/components/ui/GlassButton";
import EnterprisePagination from "@/components/ui/EnterprisePagination";
import LicenseRequestsTable from "@/components/super-admin/LicenseRequestsTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LicenseRequestItem } from "@/types/tenant";

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

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

  return (
    <div className="space-y-6 max-w-7xl">
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
        <div className="flex items-center gap-2.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Status
          </label>
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[150px] bg-card border-border text-xs font-medium text-foreground">
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
        <p className="text-xs font-medium text-muted-foreground tabular-nums">
          {total} {total === 1 ? "request" : "requests"}
        </p>
      </div>

      <div className="rounded-xl overflow-hidden border border-border">
        <LicenseRequestsTable
          requests={requests}
          loading={loading}
          statusFilter={statusFilter}
          processingId={processingId}
          onProcess={handleProcess}
        />
        {!loading && total > 0 && (
          <EnterprisePagination
            totalItems={total}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            itemName="requests"
          />
        )}
      </div>
    </div>
  );
}
