"use client";

import React from "react";
import MasterDataListPage from "@/components/admin/master-data/MasterDataListPage";
import { CLASSROOMS } from "@/lib/masterData/entities";

export default function ClassroomsPage(): React.ReactElement {
  return <MasterDataListPage entity={CLASSROOMS} />;
}
