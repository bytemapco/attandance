"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, Save } from "lucide-react";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassSelect from "@/components/ui/GlassSelect";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
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
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<TenantStatus>("ACTIVE");
  const [licenseCount, setLicenseCount] = useState<number>(100);

  useEffect(() => {
    async function fetchTenant(): Promise<void> {
      try {
        setLoading(true);
        const data = await superAdminService.getTenant(tenantId);
        setTenant(data);
        setName(data.name || "");
        setSlug(data.slug || "");
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
    if (!slug.trim() || !/^[a-z0-9-]+$/.test(slug)) {
      return void toast.error("Slug must contain only lowercase letters, numbers, and hyphens.");
    }

    try {
      setSaving(true);
      const updated = await superAdminService.updateTenant(tenantId, {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
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

  if (loading || !tenant) return <GlassLoader text="Loading institution details..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <GlassBreadcrumb
        items={[
          { label: "Super Admin", href: "/super-admin/dashboard" },
          { label: "Institutions", href: "/super-admin/tenants" },
          { label: tenant.name, href: `/super-admin/tenants/${tenantId}` },
          { label: "Edit Details" },
        ]}
      />

      <GlassPageHeader
        title="Edit Institution"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Building2 size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Institution Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <GlassInput
              label="Institution Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Stanford Academy"
              required
            />
            <GlassInput
              label="URL Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
              placeholder="e.g. stanford-academy"
              required
            />
            <GlassInput
              label="Institution Type"
              value="College / University"
              readOnly
            />
            <GlassSelect
              label="Platform Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(val) => setStatus(val as TenantStatus)}
            />
          </div>
        </GlassCard>

        <GlassCard className="p-6 space-y-6">
          <div className="border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground">Licensing</h3>
          </div>

          <div className="max-w-sm">
            <GlassInput
              label="License Quota"
              type="number"
              value={licenseCount}
              onChange={(e) => setLicenseCount(Number(e.target.value))}
              min={0}
              required
            />
          </div>
        </GlassCard>

        <div className="flex items-center justify-end gap-3 pt-2">
          <GlassButton
            type="button"
            variant="ghost"
            onClick={() => router.push(`/super-admin/tenants/${tenantId}`)}
            disabled={saving}
          >
            Cancel
          </GlassButton>
          <GlassButton type="submit" variant="primary" loading={saving} className="gap-2">
            <Save size={14} />
            <span>Save Changes</span>
          </GlassButton>
        </div>
      </form>
    </div>
  );
}
