"use client";

import React from "react";
import MasterDataListPage from "@/components/admin/master-data/MasterDataListPage";
import { DEPARTMENTS } from "@/lib/masterData/entities";

export default function DepartmentsPage(): React.ReactElement {
  return <MasterDataListPage entity={DEPARTMENTS} />;
}
