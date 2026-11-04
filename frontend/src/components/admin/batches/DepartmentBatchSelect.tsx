"use client";

import React from "react";
import SelectField from "@/components/ui/SelectField";
import { useDepartmentBatches } from "./useDepartmentBatches";

interface DepartmentBatchSelectProps {
  label: string;
  departmentId: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function DepartmentBatchSelect({
  label,
  departmentId,
  value,
  onChange,
  error,
}: DepartmentBatchSelectProps): React.ReactElement {
  const { batches, loading } = useDepartmentBatches(departmentId || undefined);
  const placeholder = !departmentId
    ? "Select a department first"
    : loading
      ? "Loading batches..."
      : batches.length === 0
        ? "No active batches for this department"
        : "Select batch";

  return (
    <SelectField
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      options={batches.map((b) => ({ value: b.id, label: b.code }))}
      error={error}
      disabled={!departmentId || batches.length === 0}
    />
  );
}
