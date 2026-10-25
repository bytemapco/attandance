"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Activity, Sliders, Users } from "lucide-react";
import toast from "react-hot-toast";

import { superAdminService } from "@/services/superAdminService";
import { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import TenantHeaderBanner from "@/components/super-admin/TenantHeaderBanner";
import TenantOverviewTab from "@/components/super-admin/TenantOverviewTab";
import TenantPoliciesTab from "@/components/super-admin/TenantPoliciesTab";
import TenantAdminsTab from "@/components/super-admin/TenantAdminsTab";
import DeleteTenantModal from "@/components/super-admin/DeleteTenantModal";
import type { TenantDetail } from "@/types/tenant";

export default function TenantDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "config" | "admins">("overview");
  const [savingConfig, setSavingConfig] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchDetails = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await superAdminService.getTenant(tenantId);
      setTenant(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load tenant details"));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) void fetchDetails();
  }, [tenantId, fetchDetails]);

  const handleSaveSettings = async (payload: {
    name: string;
    domain?: string;
    license_count: number;
    config?: Record<string, unknown>;
  }): Promise<void> => {
    setSavingConfig(true);
    try {
      const updated = await superAdminService.updateTenant(tenantId, payload);
      setTenant(updated);
      toast.success("Tenant settings updated successfully!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update tenant"));
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDeleteTenant = async (id: string): Promise<void> => {
    await superAdminService.deleteTenant(id);
    toast.success("Institution deleted successfully.");
    router.push("/super-admin/tenants");
  };

  const handleToggleStatus = async (): Promise<void> => {
    if (!tenant) return;
    const nextStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const updated = await superAdminService.updateTenant(tenant.id, { status: nextStatus });
      setTenant(updated);
      toast.success(`Tenant is now ${nextStatus.toLowerCase()}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to toggle status"));
    }
  };

  if (loading || !tenant) {
    return (
      <div className="space-y-4 max-w-6xl">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-card border border-border rounded-xl animate-pulse" />
        <div className="h-64 bg-card border border-border rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Dashboard", href: "/super-admin/dashboard" },
          { label: "Institutions", href: "/super-admin/tenants" },
          { label: tenant.name },
        ]}
      />

      <TenantHeaderBanner
        tenant={tenant}
        onRefresh={() => void fetchDetails()}
        onToggleStatus={() => void handleToggleStatus()}
        onEdit={() => router.push(`/super-admin/tenants/${tenantId}/edit`)}
        onDelete={() => setIsDeleteOpen(true)}
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === "overview"
              ? "bg-secondary text-foreground shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Activity size={14} />
          <span>Overview</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === "config"
              ? "bg-secondary text-foreground shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Sliders size={14} />
          <span>Settings</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("admins")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === "admins"
              ? "bg-secondary text-foreground shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Users size={14} />
          <span>Administrators ({tenant.admin_users?.length || 0})</span>
        </button>
      </div>

      {activeTab === "overview" && <TenantOverviewTab tenant={tenant} />}
      {activeTab === "config" && (
        <TenantPoliciesTab
          tenant={tenant}
          onSave={handleSaveSettings}
          saving={savingConfig}
        />
      )}
      {activeTab === "admins" && (
        <TenantAdminsTab tenant={tenant} onRefresh={() => void fetchDetails()} />
      )}

      <DeleteTenantModal
        isOpen={isDeleteOpen}
        tenant={tenant}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteTenant}
      />
    </div>
  );
}
