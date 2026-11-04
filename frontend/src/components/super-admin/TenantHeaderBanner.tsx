"use client";

import React from "react";
import { Building2, Power, PowerOff, RefreshCw, Edit3, Trash2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { TenantDetail } from "@/types/tenant";

interface TenantHeaderBannerProps {
  tenant: TenantDetail;
  onRefresh: () => void;
  onToggleStatus: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TenantHeaderBanner({
  tenant,
  onRefresh,
  onToggleStatus,
  onEdit,
  onDelete,
}: TenantHeaderBannerProps): React.ReactElement {
  return (
    <div className="bg-card border border-border rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Building2 size={28} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{tenant.name}</h1>
            <Badge variant={tenant.status === "ACTIVE" ? "success" : "danger"}>
              {tenant.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Button variant="secondary" onClick={onRefresh} className="gap-1.5">
          <RefreshCw size={13} />
          <span>Refresh</span>
        </Button>
        {onEdit && (
          <Button variant="secondary" onClick={onEdit} className="gap-1.5">
            <Edit3 size={13} />
            <span>Edit Details</span>
          </Button>
        )}
        <Button
          variant={tenant.status === "ACTIVE" ? "secondary" : "primary"}
          onClick={onToggleStatus}
          className="gap-1.5"
        >
          {tenant.status === "ACTIVE" ? <PowerOff size={13} /> : <Power size={13} />}
          <span>{tenant.status === "ACTIVE" ? "Suspend" : "Activate"}</span>
        </Button>
        {onDelete && (
          <Button variant="danger" onClick={onDelete} className="gap-1.5">
            <Trash2 size={13} />
            <span>Delete Institution</span>
          </Button>
        )}
      </div>
    </div>
  );
}
