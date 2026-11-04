"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import PageHeader from "@/components/ui/PageHeader";
import CampusLocationCard, {
  type CampusLocationHandle,
  type CampusLocationState,
} from "@/components/admin/settings/CampusLocationCard";
import AttendanceRulesForm from "@/components/admin/settings/AttendanceRulesForm";
import SettingsNav, { type SettingsNavItem } from "@/components/admin/settings/SettingsNav";
import SettingsSection from "@/components/admin/settings/SettingsSection";

const SECTIONS: SettingsNavItem[] = [
  { id: "campus", label: "Campus location" },
  { id: "attendance", label: "Attendance rules" },
];

export default function AdminSettingsPage(): React.ReactElement {
  const [campus, setCampus] = useState<CampusLocationState>({ dirty: false, active: false });
  const [campusSaving, setCampusSaving] = useState(false);
  const [attendanceDirty, setAttendanceDirty] = useState(false);
  const campusHandle = useRef<CampusLocationHandle | null>(null);
  const registerCampus = useCallback((handle: CampusLocationHandle | null): void => {
    campusHandle.current = handle;
  }, []);
  const anyDirty = campus.dirty || attendanceDirty;

  // Warn before closing or reloading the tab while any section has edits that are not saved.
  useEffect(() => {
    if (!anyDirty) return;
    function warn(event: BeforeUnloadEvent): void {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [anyDirty]);

  async function saveCampus(): Promise<void> {
    setCampusSaving(true);
    try {
      await campusHandle.current?.save();
    } finally {
      setCampusSaving(false);
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Settings" }]} />
      <PageHeader title="Settings" />

      <div className="mt-6 grid gap-6 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-10">
        <SettingsNav items={SECTIONS} />

        <div className="min-w-0 space-y-5">
          <SettingsSection
            id="campus"
            title="Campus location"
            status={campus.active ? { label: "Active", tone: "success" } : { label: "Not set", tone: "neutral" }}
            dirty={campus.dirty}
            saving={campusSaving}
            onSave={() => void saveCampus()}
            onDiscard={() => void campusHandle.current?.discard()}
          >
            <CampusLocationCard onStateChange={setCampus} onRegister={registerCampus} />
          </SettingsSection>

          <AttendanceRulesForm onDirtyChange={setAttendanceDirty} />
        </div>
      </div>
    </div>
  );
}
