"use client";

import React, { useState } from "react";
import { Save } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassInput from "@/components/ui/GlassInput";
import GlassButton from "@/components/ui/GlassButton";
import type { TenantDetail } from "@/types/tenant";

interface TenantPoliciesTabProps {
  tenant: TenantDetail;
  onSave: (payload: {
    name: string;
    domain?: string;
    license_count: number;
    config?: Record<string, unknown>;
  }) => Promise<void>;
  saving: boolean;
}

export default function TenantPoliciesTab({
  tenant,
  onSave,
  saving,
}: TenantPoliciesTabProps): React.ReactElement {
  const [name, setName] = useState(tenant.name || "");
  const [domain, setDomain] = useState(tenant.domain || "");
  const [licenseCount, setLicenseCount] = useState<number>(tenant.license_count || 0);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await onSave({
      name,
      domain: domain.trim() || undefined,
      license_count: Number(licenseCount),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <GlassCard className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-foreground">General Settings</h3>
          <p className="text-xs text-muted-foreground">Institution name, domain, and license quota.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassInput
            label="Institution Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <GlassInput
            label="Custom Domain"
            placeholder="e.g. portal.school.edu"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <GlassInput
            label="License Quota"
            type="number"
            value={licenseCount}
            onChange={(e) => setLicenseCount(Number(e.target.value))}
            min={0}
            required
          />
        </div>

        <div className="flex justify-end pt-2">
          <GlassButton variant="primary" disabled={saving} className="gap-2 font-semibold shadow-xs">
            <Save size={14} />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </GlassButton>
        </div>
      </GlassCard>
    </form>
  );
}
