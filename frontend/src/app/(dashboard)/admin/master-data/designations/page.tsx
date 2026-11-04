"use client";

import React from "react";
import MasterDataListPage from "@/components/admin/master-data/MasterDataListPage";
import { DESIGNATIONS } from "@/lib/masterData/entities";

export default function DesignationsPage(): React.ReactElement {
  return <MasterDataListPage entity={DESIGNATIONS} />;
}
