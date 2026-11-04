"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api";
import { DEPARTMENTS } from "@/lib/masterData/entities";
import { getRecord } from "@/services/masterData";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import GlassButton from "@/components/ui/GlassButton";
import GlassLoader from "@/components/ui/GlassLoader";
import DepartmentBatchesPanel from "@/components/admin/batches/DepartmentBatchesPanel";
import type { DepartmentResponse } from "@/types";

export default function DepartmentDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [department, setDepartment] = useState<DepartmentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecord<DepartmentResponse>(DEPARTMENTS, id)
      .then(setDepartment)
      .catch((err: unknown) => toast.error(getApiErrorMessage(err, "Failed to load department")))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <GlassLoader />;
  if (!department) return <div className="text-center py-20 text-muted-foreground">Department not found</div>;

  return (
    <div className="space-y-6">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Master Data", href: "/admin/master-data/departments" },
          { label: "Departments", href: "/admin/master-data/departments" },
          { label: department.name },
        ]}
      />
      <GlassPageHeader
        title={department.name}
        description={`Code ${department.code}`}
        actions={
          <GlassButton
            variant="secondary"
            icon={<Pencil size={15} />}
            onClick={() => router.push(`/admin/master-data/departments/${id}/edit`)}
          >
            Edit
          </GlassButton>
        }
      />
      <DepartmentBatchesPanel department={department} />
    </div>
  );
}
