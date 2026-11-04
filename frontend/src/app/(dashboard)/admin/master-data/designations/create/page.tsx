"use client";

import React from "react";
import MasterDataFormPage from "@/components/admin/master-data/MasterDataFormPage";
import { DESIGNATIONS } from "@/lib/masterData/entities";

export default function CreateDesignationPage(): React.ReactElement {
  return <MasterDataFormPage entity={DESIGNATIONS} mode="create" />;
}
