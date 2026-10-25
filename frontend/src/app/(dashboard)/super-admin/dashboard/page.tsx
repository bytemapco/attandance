"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight } from "lucide-react";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassButton from "@/components/ui/GlassButton";
import SuperAdminKpiStrip from "@/components/super-admin/SuperAdminKpiStrip";
import TenantTable from "@/components/super-admin/TenantTable";
import { superAdminService } from "@/services/superAdminService";
import type { SuperAdminStats, Tenant } from "@/types";
import toast from "react-hot-toast";

export default function SuperAdminDashboardPage(): React.ReactElement {
  const router = useRouter();
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [recentTenants, setRecentTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const [statsData, tenantsData] = await Promise.all([
        superAdminService.getStats(),
        superAdminService.getTenants({ page: 1, page_size: 5 }),
      ]);
      setStats(statsData);
      setRecentTenants(tenantsData.items);
    } catch {
      toast.error("Failed to load platform dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleToggleStatus(tenant: Tenant): Promise<void> {
    const nextStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      setUpdatingId(tenant.id);
      const updated = await superAdminService.updateTenant(tenant.id, { status: nextStatus });
      setRecentTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success(`Tenant ${updated.name} is now ${nextStatus.toLowerCase()}.`);
    } catch {
      toast.error("Failed to update tenant status.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <GlassPageHeader
        title="Institutions"
        actions={
          <GlassButton onClick={() => router.push("/super-admin/tenants/provision")} className="gap-2">
            <Plus size={15} />
            <span>Add Institution</span>
          </GlassButton>
        }
      />

      <SuperAdminKpiStrip stats={stats} loading={loading} />

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">Recent Institutions</h2>
          <Link
            href="/super-admin/tenants"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <TenantTable
          tenants={recentTenants}
          loading={loading}
          onToggleStatus={handleToggleStatus}
          statusUpdatingId={updatingId}
        />
      </div>
    </div>
  );
}
