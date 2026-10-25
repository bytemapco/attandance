"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassButton from "@/components/ui/GlassButton";
import EnterprisePagination from "@/components/ui/EnterprisePagination";
import TenantFilterBar from "@/components/super-admin/TenantFilterBar";
import TenantTable from "@/components/super-admin/TenantTable";
import DeleteTenantModal from "@/components/super-admin/DeleteTenantModal";
import { superAdminService } from "@/services/superAdminService";
import { useDebounce } from "@/hooks/useDebounce";
import type { Tenant } from "@/types/tenant";
import toast from "react-hot-toast";

export default function SuperAdminTenantsPage(): React.JSX.Element {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);

  const fetchTenants = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await superAdminService.getTenants({
        page,
        page_size: pageSize,
        q: debouncedSearch.trim() || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setTenants(data.items);
      setTotal(data.total_items ?? (data as unknown as { total?: number }).total ?? 0);
    } catch {
      toast.error("Failed to load institutions list.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter, typeFilter]);

  useEffect(() => {
    void fetchTenants();
  }, [fetchTenants]);

  async function handleToggleStatus(tenant: Tenant): Promise<void> {
    const nextStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      setUpdatingId(tenant.id);
      const updated = await superAdminService.updateTenant(tenant.id, { status: nextStatus });
      setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success(`Tenant '${updated.name}' is now ${nextStatus.toLowerCase()}.`);
    } catch {
      toast.error("Failed to update tenant status.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteTenant(id: string): Promise<void> {
    await superAdminService.deleteTenant(id);
    toast.success("Institution deleted successfully.");
    void fetchTenants();
  }

  function handleResetFilters(): void {
    setSearchQuery("");
    setStatusFilter("");
    setTypeFilter("");
    setPage(1);
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

      <TenantFilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => { setSearchQuery(q); setPage(1); }}
        statusFilter={statusFilter}
        onStatusChange={(s) => { setStatusFilter(s); setPage(1); }}
        typeFilter={typeFilter}
        onTypeChange={(t) => { setTypeFilter(t); setPage(1); }}
        onReset={handleResetFilters}
      />

      <div className="rounded-xl overflow-hidden border border-border">
        <TenantTable
          tenants={tenants}
          loading={loading}
          onToggleStatus={handleToggleStatus}
          onEditTenant={(t) => router.push(`/super-admin/tenants/${t.id}/edit`)}
          onDeleteTenant={(t) => setDeletingTenant(t)}
          statusUpdatingId={updatingId}
        />
        {!loading && total > 0 && (
          <EnterprisePagination
            totalItems={total}
            currentPage={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            itemName="institutions"
          />
        )}
      </div>

      <DeleteTenantModal
        isOpen={!!deletingTenant}
        tenant={deletingTenant}
        onClose={() => setDeletingTenant(null)}
        onConfirm={handleDeleteTenant}
      />
    </div>
  );
}
