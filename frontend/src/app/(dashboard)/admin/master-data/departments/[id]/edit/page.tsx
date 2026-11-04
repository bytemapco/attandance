"use client";

import React from "react";
import MasterDataFormPage from "@/components/admin/master-data/MasterDataFormPage";
import { DEPARTMENTS } from "@/lib/masterData/entities";

export default function EditDepartmentPage(): React.ReactElement {
  return <MasterDataFormPage entity={DEPARTMENTS} mode="edit" />;
}
