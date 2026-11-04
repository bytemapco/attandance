"use client";

import React from "react";
import MasterDataListPage from "@/components/admin/master-data/MasterDataListPage";
import { SUBJECTS } from "@/lib/masterData/entities";

export default function SubjectsPage(): React.ReactElement {
  return <MasterDataListPage entity={SUBJECTS} />;
}
