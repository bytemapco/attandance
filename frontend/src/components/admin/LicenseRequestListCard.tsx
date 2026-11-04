"use client";

import React from "react";
import { Inbox } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassBadge from "@/components/ui/GlassBadge";
import type { LicenseRequestItem, LicenseRequestStatus } from "@/types/tenant";

function statusVariant(status: LicenseRequestStatus): "success" | "danger" | "warning" | "info" {
  switch (status) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "danger";
    case "PENDING":
      return "warning";
    default:
      return "info";
  }
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface LicenseRequestListCardProps {
  requests: LicenseRequestItem[];
}

export default function LicenseRequestListCard({
  requests,
}: LicenseRequestListCardProps): React.ReactElement {
  return (
    <GlassCard className="p-5 space-y-4">
      <h3 className="text-sm font-semibold text-primary">Your License Requests</h3>
      {requests.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <Inbox size={28} className="text-muted-foreground/50 mb-2" />
          <p className="text-xs text-muted-foreground">No license requests yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30"
            >
              <div>
                <p className="text-xs font-semibold text-primary">
                  +{request.requested_count} license(s)
                </p>
                <p className="text-xs text-muted-foreground">
                  Requested {formatDate(request.created_at)}
                </p>
              </div>
              <GlassBadge variant={statusVariant(request.status)}>{request.status}</GlassBadge>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
