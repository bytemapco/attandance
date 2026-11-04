"use client";

import React from "react";
import MasterDataFormPage from "@/components/admin/master-data/MasterDataFormPage";
import { CLASSROOMS } from "@/lib/masterData/entities";

export default function CreateClassroomPage(): React.ReactElement {
  return <MasterDataFormPage entity={CLASSROOMS} mode="create" />;
}
