"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { BatchResponse } from "@/types";

export function useDepartmentBatches(departmentId: string | undefined, includeArchived = false): {
  batches: BatchResponse[];
  loading: boolean;
} {
  const [loaded, setLoaded] = useState<{ departmentId: string; batches: BatchResponse[] } | null>(null);

  useEffect(() => {
    if (!departmentId) return;
    let cancelled = false;
    api
      .get<BatchResponse[]>("/admin/batches", { params: { department_id: departmentId } })
      .then(({ data }) => {
        if (cancelled) return;
        const visible = includeArchived ? data : data.filter((b) => b.status === "ACTIVE");
        setLoaded({ departmentId, batches: visible });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ departmentId, batches: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [departmentId, includeArchived]);

  if (!departmentId) return { batches: [], loading: false };
  const current = loaded?.departmentId === departmentId ? loaded : null;
  return { batches: current?.batches ?? [], loading: !current };
}
