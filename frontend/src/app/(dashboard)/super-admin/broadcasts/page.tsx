"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

import { superAdminService } from "@/services/superAdminService";
import { getApiErrorMessage } from "@/lib/api";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import BroadcastKpiStrip from "@/components/super-admin/BroadcastKpiStrip";
import BroadcastForm from "@/components/super-admin/BroadcastForm";
import BroadcastPreview from "@/components/super-admin/BroadcastPreview";
import BroadcastHistoryTable from "@/components/super-admin/BroadcastHistoryTable";
import type { GlobalBroadcastRequest } from "@/types/tenant";

const INITIAL_FORM: GlobalBroadcastRequest = {
  title: "",
  message: "",
  type: "info",
  category: "system",
};

const TEMPLATES: Array<{
  label: string;
  title: string;
  message: string;
  type: GlobalBroadcastRequest["type"];
  category: GlobalBroadcastRequest["category"];
}> = [
  {
    label: "Maintenance",
    title: "System maintenance window",
    message: "Platform maintenance is scheduled for Sunday from 02:00 to 04:00 UTC.",
    type: "warning",
    category: "maintenance",
  },
  {
    label: "Security notice",
    title: "Security notice",
    message: "Please review and update account passwords and active session policies.",
    type: "critical",
    category: "security",
  },
  {
    label: "Term update",
    title: "Academic term configuration",
    message: "Term settings and course schedules are now open for configuration.",
    type: "success",
    category: "update",
  },
];

export default function SuperAdminBroadcastsPage(): React.ReactElement {
  const [form, setForm] = useState<GlobalBroadcastRequest>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [totalSent, setTotalSent] = useState(0);

  const handleChange = (updated: Partial<GlobalBroadcastRequest>): void => {
    setForm((prev) => ({ ...prev, ...updated }));
  };

  const handleApplyTemplate = (tpl: (typeof TEMPLATES)[number]): void => {
    setForm((prev) => ({
      ...prev,
      title: tpl.title,
      message: tpl.message,
      type: tpl.type,
      category: tpl.category,
    }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required.");
      return;
    }

    try {
      setSubmitting(true);
      await superAdminService.createBroadcast({
        title: form.title.trim(),
        message: form.message.trim(),
        target_role: form.target_role || undefined,
        type: form.type,
        category: form.category,
      });

      toast.success("Announcement sent");
      setForm(INITIAL_FORM);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send announcement"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in-up">
      <GlassBreadcrumb
        items={[
          { label: "Dashboard", href: "/super-admin/dashboard" },
          { label: "Announcements" },
        ]}
      />

      <GlassPageHeader
        title="Announcements"
        description="Send platform notices to users."
        actions={
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Templates:</span>
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="px-2.5 py-1 rounded-lg bg-card/60 hover:bg-muted border border-border/60 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Top KPI Metrics Row matching other pages */}
      <BroadcastKpiStrip totalSent={totalSent} />

      {/* Main Composer & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <BroadcastForm
            form={form}
            onChange={handleChange}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </div>

        <div className="lg:col-span-5 sticky top-6">
          <BroadcastPreview broadcast={form} />
        </div>
      </div>

      {/* History Table */}
      <BroadcastHistoryTable
        refreshTrigger={refreshTrigger}
        onCountChange={(count) => setTotalSent(count)}
      />
    </div>
  );
}
