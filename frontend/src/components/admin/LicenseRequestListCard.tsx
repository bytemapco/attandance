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
      <h3 className="text-sm font-semibold text-[#28363b]">Your License Requests</h3>
      {requests.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <Inbox size={28} className="text-[#526f78]/50 mb-2" />
          <p className="text-xs text-[#526f78]">No license requests yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-3 rounded-xl border border-[#e3e1dc] bg-[#eeece7]/30"
            >
              <div>
                <p className="text-xs font-semibold text-[#28363b]">
                  +{request.requested_count} license(s)
                </p>
                <p className="text-[11px] text-[#526f78]">
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
