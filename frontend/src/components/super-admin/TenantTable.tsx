"use client";

import React from "react";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassEmptyState from "@/components/ui/GlassEmptyState";
import Link from "next/link";
import { Building2, Power, PowerOff, ExternalLink, Edit3, Trash2 } from "lucide-react";
import type { Tenant, TenantStatus } from "@/types/tenant";
import { Skeleton } from "@/components/ui/Skeleton";

interface TenantTableProps {
  tenants: Tenant[];
  loading: boolean;
  onToggleStatus: (tenant: Tenant) => void;
  onEditTenant?: (tenant: Tenant) => void;
  onDeleteTenant?: (tenant: Tenant) => void;
  statusUpdatingId?: string | null;
}

function statusToVariant(status: TenantStatus): "success" | "danger" | "warning" | "info" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "SUSPENDED":
      return "danger";
    case "TRIAL":
      return "warning";
    case "PROVISIONING":
      return "info";
    default:
      return "info";
  }
}

export default function TenantTable({
  tenants,
  loading,
  onToggleStatus,
  onEditTenant,
  onDeleteTenant,
  statusUpdatingId,
}: TenantTableProps): React.ReactElement {
  if (loading) {
    return (
      <div className="space-y-4 rounded-lg border border-border bg-card p-4" role="status" aria-label="Loading institutions" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="hidden h-7 w-20 sm:block" />
          </div>
        ))}
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <GlassEmptyState
        title="No institutions found"
        message="No institutions match your search or filter criteria."
      />
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary/80 border-b border-border text-xs font-semibold text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Institution</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Licenses</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tenants.map((tenant) => {
              const isUpdating = statusUpdatingId === tenant.id;
              const isActive = tenant.status === "ACTIVE";
              const rawDate = tenant.created_at || (tenant as unknown as { createdAt?: string }).createdAt;
              const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              }) : "N/A";

              const licenseCount = tenant.license_count ?? (tenant as unknown as { licenseCount?: number }).licenseCount;

              return (
                <tr key={tenant.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <Link href={`/super-admin/tenants/${tenant.id}`} className="flex items-center gap-2.5 group">
                      <div className="h-8 w-8 rounded-lg bg-secondary text-primary border border-border flex items-center justify-center shrink-0 group-hover:bg-accent-soft group-hover:text-accent-strong transition-colors">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors flex items-center gap-1">
                          <span>{tenant.name}</span>
                          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                      </div>
                    </Link>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="text-xs text-foreground font-medium">College / University</span>
                  </td>

                  <td className="px-4 py-3.5">
                    <GlassBadge variant={statusToVariant(tenant.status)}>
                      {tenant.status}
                    </GlassBadge>
                  </td>

                  <td className="px-4 py-3.5 text-foreground font-mono font-medium">
                    {licenseCount ? `${licenseCount.toLocaleString()} licenses` : "Unlimited"}
                  </td>

                  <td className="px-4 py-3.5 text-muted-foreground text-xs font-mono">
                    {formattedDate}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/super-admin/tenants/${tenant.id}`}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-secondary hover:bg-secondary/70 text-foreground border border-border transition-colors"
                      >
                        Manage
                      </Link>
                      {onEditTenant && (
                        <button
                          type="button"
                          onClick={() => onEditTenant(tenant)}
                          title="Edit institution"
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                        >
                          <Edit3 size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => onToggleStatus(tenant)}
                        title={isActive ? "Suspend institution" : "Activate institution"}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border transition-colors disabled:opacity-50 cursor-pointer ${
                          isActive
                            ? "bg-warning-soft text-warning border-warning-border hover:bg-warning-soft/80"
                            : "bg-success-soft text-success border-success-border hover:bg-success-soft/80"
                        }`}
                      >
                        {isActive ? <PowerOff size={12} /> : <Power size={12} />}
                        <span>{isActive ? "Suspend" : "Activate"}</span>
                      </button>
                      {onDeleteTenant && (
                        <button
                          type="button"
                          onClick={() => onDeleteTenant(tenant)}
                          title="Delete institution"
                          className="p-1 rounded-md text-destructive hover:bg-destructive-soft transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
