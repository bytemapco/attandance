"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, Save } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import SelectField from "@/components/ui/SelectField";
import Button from "@/components/ui/Button";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { superAdminService } from "@/services/superAdminService";
import { getApiErrorMessage } from "@/lib/api";
import type { TenantDetail, TenantStatus } from "@/types/tenant";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
];

export default function EditTenantPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [status, setStatus] = useState<TenantStatus>("ACTIVE");
  const [licenseCount, setLicenseCount] = useState<number>(100);

  useEffect(() => {
    async function fetchTenant(): Promise<void> {
      try {
        setLoading(true);
        const data = await superAdminService.getTenant(tenantId);
        setTenant(data);
        setName(data.name || "");
        setStatus(data.status || "ACTIVE");
        setLicenseCount(data.license_count ?? 100);
      } catch {
        toast.error("Failed to load institution details.");
        router.push("/super-admin/tenants");
      } finally {
        setLoading(false);
      }
    }
    if (tenantId) void fetchTenant();
  }, [tenantId, router]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!name.trim()) return void toast.error("Institution name cannot be empty.");

    try {
      setSaving(true);
      const updated = await superAdminService.updateTenant(tenantId, {
        name: name.trim(),
        status,
        license_count: Number(licenseCount),
      });
      toast.success(`"${updated.name}" updated successfully.`);
      router.push(`/super-admin/tenants/${tenantId}`);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to update institution."));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !tenant) return <PageSkeleton text="Loading institution details..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <Breadcrumb
        items={[
          { label: "Super Admin", href: "/super-admin/dashboard" },
          { label: "Institutions", href: "/super-admin/tenants" },
          { label: tenant.name, href: `/super-admin/tenants/${tenantId}` },
          { label: "Edit Details" },
        ]}
      />

      <PageHeader
        title="Edit institution"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Building2 size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Institution Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Institution Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stanford Academy"
              required
            />
            <Input
              label="Institution Type"
              value="College / University"
              readOnly
            />
            <SelectField
              label="Platform Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(val) => setStatus(val as TenantStatus)}
            />
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <div className="border-b border-border pb-3">
            <h3 className="text-sm font-semibold text-foreground">Licensing</h3>
          </div>

          <div className="max-w-sm">
            <Input
              label="License Quota"
              type="number"
              value={licenseCount}
              onChange={(e) => setLicenseCount(Number(e.target.value))}
              min={0}
              required
            />
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/super-admin/tenants/${tenantId}`)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving} className="gap-2">
            <Save size={14} />
            <span>Save Changes</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
