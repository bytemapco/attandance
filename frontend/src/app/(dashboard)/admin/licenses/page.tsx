"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { KeyRound, RefreshCw, Plus } from "lucide-react";
import { superAdminService } from "@/services/superAdminService";
import { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassButton from "@/components/ui/GlassButton";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import LicenseRequestListCard from "@/components/admin/LicenseRequestListCard";
import type { LicenseRequestItem, TenantLicenseUsage } from "@/types/tenant";

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
    <div className="space-y-6 max-w-5xl animate-fade-in">
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
            <div key={i} className="h-24 rounded-2xl bg-[#eeece7]/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="p-5">
            <p className="text-xs text-[#526f78]">Total Licenses</p>
            <p className="text-2xl font-bold text-[#28363b] mt-1">
              {licenseCount.toLocaleString()}
            </p>
            <p className="text-[11px] text-[#526f78] mt-2">Allocated seats for students & teachers</p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-xs text-[#526f78]">Seats Used</p>
            <p className="text-2xl font-bold text-[#28363b] mt-1">
              {totalUsed.toLocaleString()}
            </p>
            <p className="text-[11px] text-[#526f78] mt-2">
              {usage ? `${usage.student_count} students · ${usage.teacher_count} teachers` : "—"}
            </p>
          </GlassCard>
          <GlassCard className="p-5">
            <p className="text-xs text-[#526f78]">Remaining Seats</p>
            <p className="text-2xl font-bold text-[#28363b] mt-1">
              {(usage?.remaining ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-[#526f78] mt-2">Available for new users</p>
          </GlassCard>
        </div>
      )}

      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#28363b]">Capacity</p>
          <p className="text-xs text-[#526f78]">{pct}% used</p>
        </div>
        <div className="w-full h-2 bg-[#eeece7] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              pct > 90 ? "bg-[#b54242]" : pct > 70 ? "bg-[#8a5b12]" : "bg-[#28363b]"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#28363b]/10 text-[#28363b]">
              <KeyRound size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#28363b]">Request More Licenses</h3>
              <p className="text-[11px] text-[#526f78]">
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

        <LicenseRequestListCard requests={requests} />
      </div>
    </div>
  );
}
