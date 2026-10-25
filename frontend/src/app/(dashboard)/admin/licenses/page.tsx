"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { KeyRound, RefreshCw, Plus, Inbox } from "lucide-react";
import { superAdminService } from "@/services/superAdminService";
import { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassBadge from "@/components/ui/GlassBadge";
import type { LicenseRequestItem, LicenseRequestStatus, TenantLicenseUsage } from "@/types/tenant";

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
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TenantLicensesPage(): React.JSX.Element {
  const [usage, setUsage] = useState<TenantLicenseUsage | null>(null);
  const [requests, setRequests] = useState<LicenseRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestCount, setRequestCount] = useState("10");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const [usageData, requestsData] = await Promise.all([
        superAdminService.getLicenseUsage(),
        superAdminService.getTenantLicenseRequests(),
      ]);
      setUsage(usageData);
      setRequests(requestsData.items);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load license information"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmitRequest(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const count = parseInt(requestCount, 10);
    if (!Number.isFinite(count) || count < 1) {
      toast.error("Please enter a valid number of licenses (at least 1).");
      return;
    }
    try {
      setSubmitting(true);
      await superAdminService.requestLicenses(count);
      toast.success(`License request for ${count} seat(s) submitted. Awaiting super admin approval.`);
      setRequestCount("10");
      await loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to submit license request"));
    } finally {
      setSubmitting(false);
    }
  }

  const totalUsed = usage?.total_used ?? 0;
  const licenseCount = usage?.license_count ?? 0;
  const pct = licenseCount > 0 ? Math.min(100, Math.round((totalUsed / licenseCount) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Licenses" },
        ]}
      />

      <GlassPageHeader
        title="Licenses & Capacity"
        description="Monitor your institution's license usage and request additional seats when needed."
        actions={
          <GlassButton variant="ghost" onClick={() => void loadData()} className="gap-2">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </GlassButton>
        }
      />

      {loading && !usage ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <p className="text-xs text-muted-foreground">Total Licenses</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {licenseCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">Allocated seats for students & teachers</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-muted-foreground">Seats Used</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {totalUsed.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">
            {usage ? `${usage.student_count} students · ${usage.teacher_count} teachers` : "—"}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs text-muted-foreground">Remaining Seats</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {(usage?.remaining ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">Available for new users</p>
        </GlassCard>
      </div>
      )}

      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-foreground">Capacity</p>
          <p className="text-xs text-muted-foreground">{pct}% used</p>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-primary"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <KeyRound size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Request More Licenses</h3>
              <p className="text-[11px] text-muted-foreground">
                Submit a request and your platform administrator will review it.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitRequest} className="space-y-3">
            <GlassInput
              label="Number of additional licenses"
              type="number"
              min={1}
              value={requestCount}
              onChange={(e) => setRequestCount(e.target.value)}
              placeholder="e.g. 10"
            />
            <GlassButton type="submit" variant="primary" loading={submitting} className="w-full gap-2">
              <Plus size={14} />
              <span>Submit License Request</span>
            </GlassButton>
          </form>
        </GlassCard>

        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Your License Requests</h3>
          {requests.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <Inbox size={28} className="text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">No license requests yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
                >
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      +{request.requested_count} license(s)
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Requested {formatDate(request.created_at)}
                    </p>
                  </div>
                  <GlassBadge variant={statusVariant(request.status)}>{request.status}</GlassBadge>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
