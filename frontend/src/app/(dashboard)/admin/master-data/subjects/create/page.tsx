"use client";

import React from "react";
import MasterDataFormPage from "@/components/admin/master-data/MasterDataFormPage";
import { SUBJECTS } from "@/lib/masterData/entities";

export default function CreateSubjectPage(): React.ReactElement {
  return <MasterDataFormPage entity={SUBJECTS} mode="create" />;
}
