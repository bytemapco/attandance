"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api";
import { DEPARTMENTS } from "@/lib/masterData/entities";
import { getRecord } from "@/services/masterData";
import Breadcrumb from "@/components/ui/Breadcrumb";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import PageSkeleton from "@/components/ui/PageSkeleton";
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

  if (loading) return <PageSkeleton />;
  if (!department) return <div className="text-center py-20 text-muted-foreground">Department not found</div>;

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Master Data", href: "/admin/master-data/departments" },
          { label: "Departments", href: "/admin/master-data/departments" },
          { label: department.name },
        ]}
      />
      <PageHeader
        title={department.name}
        description={`Code ${department.code}`}
        actions={
          <Button
            variant="secondary"
            icon={<Pencil size={15} />}
            onClick={() => router.push(`/admin/master-data/departments/${id}/edit`)}
          >
            Edit
          </Button>
        }
      />
      <DepartmentBatchesPanel department={department} />
    </div>
  );
}
