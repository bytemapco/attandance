"use client";

import React from "react";
import { UserPlus } from "lucide-react";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassButton from "@/components/ui/GlassButton";
import type { ClassResponse } from "@/types";

interface EnrollHeaderProps {
  cls: ClassResponse;
  selectedCount: number;
  enrolling: boolean;
  onEnroll: () => void;
}

export default function EnrollHeader({
  cls,
  selectedCount,
  enrolling,
  onEnroll,
}: EnrollHeaderProps): React.ReactElement {
  return (
    <>
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Classes", href: "/admin/classes" },
          { label: cls.name, href: `/admin/classes/${cls.id}` },
          { label: "Enroll Students" },
        ]}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <GlassPageHeader
          title="Enroll Students"
          description={`Select students to enroll into ${cls.name} (${cls.subject_code})`}
        />
        <div className="flex items-center gap-3 bg-card p-2.5 rounded-xl border border-border shadow-xs">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Selected</p>
            <p className="text-lg font-bold text-foreground leading-none">{selectedCount}</p>
          </div>
          <div className="h-6 w-px bg-border mx-1" />
          <GlassButton
            variant="primary"
            size="sm"
            icon={<UserPlus size={14} />}
            onClick={onEnroll}
            loading={enrolling}
            disabled={selectedCount === 0}
          >
            Enroll Selected
          </GlassButton>
        </div>
      </div>
    </>
  );
}
