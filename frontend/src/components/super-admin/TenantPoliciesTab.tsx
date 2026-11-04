"use client";

import React, { useState } from "react";
import { Save } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { TenantDetail } from "@/types/tenant";

interface TenantPoliciesTabProps {
  tenant: TenantDetail;
  onSave: (payload: {
    name: string;
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
  const [licenseCount, setLicenseCount] = useState<number>(tenant.license_count || 0);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    await onSave({
      name,
      license_count: Number(licenseCount),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">General Settings</h3>
          <p className="text-xs text-muted-foreground">Institution name and license quota.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Institution Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="License Quota"
            type="number"
            value={licenseCount}
            onChange={(e) => setLicenseCount(Number(e.target.value))}
            min={0}
            required
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" disabled={saving} className="gap-2 font-semibold">
            <Save size={14} />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </Card>
    </form>
  );
}
