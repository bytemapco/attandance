"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import api, { getApiErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";
import GlassBreadcrumb from "@/components/ui/GlassBreadcrumb";
import GlassPageHeader from "@/components/ui/GlassPageHeader";
import CampusBroadcastForm from "@/components/admin/CampusBroadcastForm";
import CampusBroadcastPreview from "@/components/admin/CampusBroadcastPreview";
import type { NotificationBroadcastCreate } from "@/types/notification";

const INITIAL_FORM: NotificationBroadcastCreate = {
  title: "",
  message: "",
  target_role: "ALL",
  type: "info",
  category: "system",
  link: "",
};

export default function BroadcastNotificationPage(): React.JSX.Element {
  const router = useRouter();
  const [formData, setFormData] = useState<NotificationBroadcastCreate>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Please provide both a title and message.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/notifications/broadcast", {
        title: formData.title.trim(),
        message: formData.message.trim(),
        target_role: formData.target_role,
        type: formData.type,
        category: formData.category,
        link: formData.link?.trim() || null,
      });

      toast.success("Announcement sent successfully");
      router.push("/admin/notifications");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to send announcement"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      <GlassBreadcrumb
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Notifications", href: "/admin/notifications" },
          { label: "New Announcement" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <GlassPageHeader
          title="Send Announcement"
        />
        <button
          type="button"
          onClick={() => router.push("/admin/notifications")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft size={13} />
          <span>Back to Notifications</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <CampusBroadcastForm
            formData={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            submitting={submitting}
            onReset={() => setFormData(INITIAL_FORM)}
          />
        </div>

        <div className="lg:col-span-5">
          <CampusBroadcastPreview formData={formData} />
        </div>
      </div>
    </div>
  );
}
